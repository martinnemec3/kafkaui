import { BrowserWindow, ipcMain } from 'electron';
import { GroupOverview, ITopicMetadata, Kafka, GroupDescriptions, AssignerProtocol } from 'kafkajs';
import configuration from '../../main/configuration';
import { CreateTopicData, CreateTopicResponse, InstanceInfoResponse, KavkaMessage, ListGroupsResponse, ListTopicsResponse, RemoveTopicsResponse, StartConsumptionResponse, TopicDetails } from '../../types/types';

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
    console.log("Fetching instance information for connection '%s'", connectionId);
    const kafka = buildKafka(connectionId);
    const admin = kafka.admin();
    try {
      await admin.connect();
      const topics : string[] = await admin.listTopics();
      const topicsMetadata : ITopicMetadata[] = await admin.fetchTopicMetadata({topics}).then(result => result.topics);
      const topicsDetails = topicsMetadata.reduce((accumulator, current) => {
        const partitions = current.partitions.map(p => ({...p}));
        return ({...accumulator, [current.name]: { partitions }});
      }, {});
      const clusterInfo = await admin.describeCluster();
      await admin.disconnect();
      return { result: "success", topics: topicsDetails, clusterInfo };
    } catch (e) {
      return { result: "error", message: e.message };
    }
  })

  ipcMain.handle('listTopics', async (event, connectionId) : Promise<ListTopicsResponse> => {
    console.log("Listing topics for connection '%s'", connectionId);
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
  
  ipcMain.handle('startConsumption', async (event, connectionId: string, topicName: string) : Promise<StartConsumptionResponse> => {
    console.log("Starting consumption for connection '%s', topic '%s'", connectionId, topicName);
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

  ipcMain.handle('createTopic', async (event, connectionId: string, data : CreateTopicData) : Promise<CreateTopicResponse> => {
    console.warn("Creating new topic '%s' in connection '%s'", data.name, connectionId, data);
    const kafka = buildKafka(connectionId);
    const admin = kafka.admin();
    try {
      await admin.connect();
      await admin.createTopics({topics: [{
        topic: data.name,
        numPartitions: data.partitions,
        replicationFactor: data.replicationFactor
      }]});
      await admin.disconnect();
      return { result: "success" };
    } catch (e) {
      return { result: "error", message: e.message };
    }
  });

  ipcMain.handle('removeTopics', async (event, connectionId, topicNames: string[]) : Promise<RemoveTopicsResponse> => {
    console.log("Removing topic(s) '%s' of connection '%s'", topicNames, connectionId);
    const kafka = buildKafka(connectionId);
    const admin = kafka.admin();
    try {
      await admin.connect();
      await admin.deleteTopics({topics: topicNames, timeout: 10000});
      await admin.disconnect();
      return { result: "success" };
    } catch (e) {
      return { result: "error", message: e.message };
    }
  });

  ipcMain.handle('listGroups', async (event, connectionId, topicName) : Promise<ListGroupsResponse> => {
    console.log("Listing consumer groups for topic '%s' of connection '%s'", topicName, connectionId);
    const kafka = buildKafka(connectionId);
    const admin = kafka.admin();
    try {
      await admin.connect();
      const overviewResponse : GroupOverview[] = (await admin.listGroups()).groups;
      const descriptionResponse : GroupDescriptions = await admin.describeGroups(overviewResponse.map(go => go.groupId));
      await admin.disconnect();
      const groups = descriptionResponse.groups.filter(group => {
        return group.members.find(gm => AssignerProtocol.MemberMetadata.decode(gm.memberMetadata).topics.indexOf(topicName) > -1);
      }).map(g => {
        return {
          groupId: g.groupId,
          protocol: g.protocol,
          protocolType: g.protocolType,
          state: g.state,
          members: g.members.map(member => ({clientId: member.clientId, host: member.clientHost})),
        }
      });
      return { result: "success", groups };
    } catch (e) {
      return { result: "error", message: e.message };
    }
  })
}