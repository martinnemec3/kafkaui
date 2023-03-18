import { ClusterInfo, TopicDetails, TopicsDetails } from "../types/types";

export type ConnectionDataLoading = { status: "loading", previousTopics?: { [topic: string]: TopicDetails }, previousClusterInfo?: ClusterInfo };
export type ConnectionDataLoaded = { status: "loaded"; topics: TopicsDetails; clusterInfo: ClusterInfo };
export type ConnectionDataError = { status: "error"; message: string; };
export type ConnectionData = ConnectionDataLoading | ConnectionDataLoaded | ConnectionDataError;
export type ConnectionsData = { [connectionId: string]: ConnectionData };