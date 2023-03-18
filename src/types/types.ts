
export type ErrorMessageType = { result: "error", message: string };
export type ListTopicsResponse = { result: "success", topics: string[] } | ErrorMessageType;
export type ClusterInfo = {
    brokers: {
        nodeId: number;
        host: string;
        port: number;
    }[];
    controller: number;
    clusterId: string;
}
export type PartitionDetails = {
    partitionErrorCode: number;
    partitionId: number;
    leader: number;
    replicas: number[];
    isr: number[];
    offlineReplicas?: number[];
}
export type TopicDetails = { partitions: PartitionDetails[] }
export type TopicsDetails = { [topic: string]: TopicDetails };
export type InstanceInfoResponse = { result: "success"; topics: TopicsDetails; clusterInfo: ClusterInfo } | ErrorMessageType;
export type GroupMember = { clientId: string, host: string }
export type GroupDescription = { groupId: string, protocol: string, protocolType: string, state: string, members: GroupMember[] }
export type ListGroupsResponse = { result: "success", groups: GroupDescription[] } | ErrorMessageType;
export type StartConsumptionResponse = { result: "success", messages: KavkaMessage[] } | ErrorMessageType;
export type CreateTopicData = { name: string, partitions?: number, replicationFactor?: number }
export type CreateTopicResponse = { result: "success" } | ErrorMessageType;
export type RemoveTopicsResponse = { result: "success" } | ErrorMessageType;
export type KavkaMessage = { offset: number, partition: number, key: string, value: string }

export type ChooseTopicResponse = { result: "success" } | { result: "error", message: string }

export type Api = {
    getConfiguration: () => Promise<Configuration>,
    fetchInstanceInfo: (connectionId : string) => Promise<InstanceInfoResponse>,
    listGroups: (connectionid : string, topicName : string) => Promise<ListGroupsResponse>,
    startConsumption: (connectionId : string, topicName : string) => Promise<StartConsumptionResponse>,
    createTopic: (connectionId : string, data: CreateTopicData) => Promise<CreateTopicResponse>,
    removeTopics: (connectionId : string, topics : string[]) => Promise<RemoveTopicsResponse>,
}

export type ConnectionDetails = {
    id: string,
    name: string,
    servers: string[],
    ssl?: {
        key?: string,
        cert?: string,
        rejectUnauthorized?: boolean
    }
}

export type Configuration = {
    connections: ConnectionDetails[],
};