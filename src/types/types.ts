import { GroupDescriptions, ITopicMetadata } from "kafkajs";

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
export type InstanceInfoResponse = { result: "success"; topics: string[]; clusterInfo: ClusterInfo } | ErrorMessageType;
export type ListTopicMetadataResponse = { result: "success", topicMetadata: ITopicMetadata } | ErrorMessageType;
export type GroupDescription = { groupId: string, userData: string }
export type ListGroupsResponse = { result: "success", groups: GroupDescription[] } | ErrorMessageType;
export type StartConsumptionResponse = { result: "success", messages: KavkaMessage[] } | ErrorMessageType;
export type RemoveTopicResponse = { result: "success" } | ErrorMessageType;
export type KavkaMessage = { offset: number, partition: number, key: string, value: string }

export type ChooseTopicResponse = { result: "success" } | { result: "error", message: string }

export type Api = {
    getConfiguration: () => Promise<Configuration>,
    fetchInstanceInfo: (connectionId : string) => Promise<InstanceInfoResponse>,
    listTopicMetadata: (connectionId : string, topicName : string) => Promise<ListTopicMetadataResponse>,
    listGroups: (connectionid : string, topicName : string) => Promise<ListGroupsResponse>,
    startConsumption: (connectionId : string, topicName : string) => Promise<StartConsumptionResponse>,
    removeTopic: (connectionId : string, topicName : string) => Promise<RemoveTopicResponse>,
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