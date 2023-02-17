// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { Api, ListGroupsResponse, ListTopicMetadataResponse } from './types/types';

contextBridge.exposeInMainWorld('electronAPI', {
    getConfiguration: () => ipcRenderer.invoke('getConfiguration'),
    fetchInstanceInfo: (connectionId : string) => ipcRenderer.invoke('fetchInstanceInfo', connectionId),
    listTopicMetadata: (connectionId: string, topicName: string) : Promise<ListTopicMetadataResponse> => ipcRenderer.invoke('listTopicMetadata', connectionId, topicName),
    listGroups: (connectionid : string, topicName: string) : Promise<ListGroupsResponse> => ipcRenderer.invoke('listGroups', connectionid, topicName),
    startConsumption: (connectionId: string, topic: string, offset?: number) => ipcRenderer.invoke('startConsumption', connectionId, topic, offset),
    removeTopic: (connectionId : string, topicName : string) => ipcRenderer.invoke('removeTopic', connectionId, topicName),
} as Api)