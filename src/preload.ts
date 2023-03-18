// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { CreateTopicData, Api, InstanceInfoResponse, ListGroupsResponse } from './types/types';

contextBridge.exposeInMainWorld('electronAPI', {
    getConfiguration: () => ipcRenderer.invoke('getConfiguration'),
    fetchInstanceInfo: (connectionId : string): Promise<InstanceInfoResponse> => ipcRenderer.invoke('fetchInstanceInfo', connectionId),
    listGroups: (connectionid : string, topicName: string) : Promise<ListGroupsResponse> => ipcRenderer.invoke('listGroups', connectionid, topicName),
    startConsumption: (connectionId: string, topic: string, offset?: number) => ipcRenderer.invoke('startConsumption', connectionId, topic, offset),
    createTopic: (connectionId : string, data: CreateTopicData) => ipcRenderer.invoke('createTopic', connectionId, data),
    removeTopics: (connectionId : string, topicNames : string[]) => ipcRenderer.invoke('removeTopics', connectionId, topicNames),
} as Api)