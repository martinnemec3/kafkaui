import { ClusterInfo } from "../types/types";


export type ConnectionDataLoading = { status: "loading", previousTopics?: string[], previousClusterInfo?: ClusterInfo };
export type ConnectionDataLoaded = { status: "loaded"; topics: string[]; clusterInfo: ClusterInfo };
export type ConnectionDataError = { status: "error"; message: string; };
export type ConnectionData = ConnectionDataLoading | ConnectionDataLoaded | ConnectionDataError;
export type ConnectionsData = { [connectionId: string]: ConnectionData };