import { BrowserWindow, ipcMain } from 'electron';
import { GroupOverview, ITopicMetadata, Kafka, GroupDescriptions, AssignerProtocol } from 'kafkajs';
import configuration from '../../main/configuration';
import { InstanceInfoResponse, KavkaMessage, ListGroupsResponse, ListTopicMetadataResponse, ListTopicsResponse, RemoveTopicResponse, StartConsumptionResponse } from '../../types/types';

const buildKafka = (connectionId : string) : Kafka => {
    const connectionConfig = configuration.connections.find(c => c.id === connectionId);
    const kafka = new Kafka({
      clientId: 'Kavka',
      brokers: connectionConfig.servers,
      retry: { retries: 0 },
      ssl: connectionConfig.ssl ? {
          key: connectionConfig.ssl.key,
          cert: connectionConfig.ssl.cert,
          rejectUnauthorized: connectionConfig.ssl.rejectUnauthorized
      } : undefined,
    });
    return kafka;
}

export const register = (mainWindow : BrowserWindow) => {
  
  ipcMain.handle('fetchInstanceInfo', async (event, connectionId) : Promise<InstanceInfoResponse> => {
    const kafka = buildKafka(connectionId);
    const admin = kafka.admin();
    try {
      await admin.connect();
      const topics = await admin.listTopics();
      const clusterInfo = await admin.describeCluster();
      await admin.disconnect();
      return { result: "success", topics, clusterInfo };
    } catch (e) {
      return { result: "error", message: e.message };
    }
  })

  ipcMain.handle('listTopics', async (event, connectionId) : Promise<ListTopicsResponse> => {
    const kafka = buildKafka(connectionId);
    const admin = kafka.admin();
    try {
      await admin.connect();
      const topics = await admin.listTopics();
      await admin.disconnect();
      return { result: "success", topics };
    } catch (e) {
      return { result: "error", message: e.message };
    }
  })
  
  ipcMain.handle('listTopicMetadata', async (event, connectionId, topicName) : Promise<ListTopicMetadataResponse> => {
    const kafka = buildKafka(connectionId);
    const admin = kafka.admin();
    try {
      await admin.connect();
      const topicMetadata : ITopicMetadata = await admin.fetchTopicMetadata({topics: [topicName]}).then(m => m.topics[0]);
      await admin.disconnect();
      return { result: "success", topicMetadata };
    } catch (e) {
      return { result: "error", message: e.message };
    }
  })
  
  ipcMain.handle('startConsumption', async (event, connectionId: string, topicName: string) : Promise<StartConsumptionResponse> => {
    const kafka = buildKafka(connectionId);
    let highWatermark : number;
    const admin = kafka.admin();
    try {
      await admin.connect();
      highWatermark = await admin.fetchTopicOffsets(topicName).then(l => l.reduce((a, c) => Number(c.high) > a ? Number(c.high) : a, -1));
      console.log("TOPIC OFFSETS: ", await admin.fetchTopicOffsets(topicName));
      await admin.disconnect();
    } catch (e) {
      return { result: "error", message: e.message };
    }
    console.log("Last Offset: ", highWatermark);
    if (highWatermark === -1) {
        return {result: "success", messages: []};
    }
    // consume up to the offset
    let resolvePromise: (value: StartConsumptionResponse | PromiseLike<StartConsumptionResponse>) => void;
    const promise: Promise<StartConsumptionResponse> = new Promise((resolve) => {
        resolvePromise = resolve;
    })
    const messages: KavkaMessage[] = [];
    const consumer = kafka.consumer({groupId: (Math.random() + 1).toString(36), allowAutoTopicCreation: false, readUncommitted: false });
    const timeout: NodeJS.Timeout = setTimeout(() => {
        consumer.disconnect().then(() => resolvePromise({ result: "success", messages }))
    }, 5000);
    try {
      await consumer.connect();
      await consumer.subscribe({topics: [topicName], fromBeginning: true});
      await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
          const kavkaMessage : KavkaMessage = {
            offset: Number(message.offset),
            partition: partition,
            key: message.key?.toString("utf-8"),
            value: message.value?.toString("utf-8")
          }
          messages.push(kavkaMessage);
          console.log("Checking last offset ", kavkaMessage);
          timeout.refresh();
          if (highWatermark - 1 === Number(message.offset)) {
            clearTimeout(timeout);
            pause();
            consumer.disconnect().then(() => resolvePromise({ result: "success", messages }))
          }
        },
      });
      return promise;
    } catch (e) {
      return { result: "error", message: e.message };
    }
  });

  ipcMain.handle('removeTopic', async (event, connectionId, topicName) : Promise<RemoveTopicResponse> => {
    const kafka = buildKafka(connectionId);
    const admin = kafka.admin();
    try {
      await admin.connect();
      await admin.deleteTopics({topics: [topicName], timeout: 10000});
      await admin.disconnect();
      return { result: "success" };
    } catch (e) {
      return { result: "error", message: e.message };
    }
  });

  ipcMain.handle('listGroups', async (event, connectionId, topicName) : Promise<ListGroupsResponse> => {
    const kafka = buildKafka(connectionId);
    const admin = kafka.admin();
    try {
      await admin.connect();
      const overviewResponse : GroupOverview[] = (await admin.listGroups()).groups;
      const descriptionResponse : GroupDescriptions = await admin.describeGroups(overviewResponse.map(go => go.groupId));
      await admin.disconnect();
      const groups = descriptionResponse.groups.filter(group => {
        return group.members.find(gm => AssignerProtocol.MemberMetadata.decode(gm.memberMetadata).topics.indexOf(topicName) > -1);
      }).map(g => ({groupId: g.groupId, userData: g.members.map(gm => AssignerProtocol.MemberAssignment.decode(gm.memberAssignment).assignment).filter(a => topicName in a).map(a => a[topicName]).join(",")}));
      return { result: "success", groups };
    } catch (e) {
      return { result: "error", message: e.message };
    }
  })
}