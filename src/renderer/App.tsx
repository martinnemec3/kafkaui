import React, { useEffect, useMemo, useState } from 'react'
import Panel, { PanelEvent, PanelSelection } from './panel/Panel';
import { Configuration, InstanceInfoResponse } from '../types/types';
import { getApi } from './helper';
import TopicDetail from './TopicDetail';
import ConnectionDetail from './ConnectionDetail';
import ConnectionList from './home/ConnectionList';
import NewConnection from './home/NewConnection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import { ConnectionDataLoading, ConnectionsData } from './Types';
import 'bootstrap/dist/css/bootstrap.min.css';

type ChosenPage = { page: "home" | "new-connection" } |
                  { page: "connection", connectionId: string } |
                  { page: "topic", connectionId: string, topicName: string }

const App = () => {

    const [configuration, setConfiguration] = useState<Configuration | undefined>();
    const [chosenPage, setChosenPage] = useState<ChosenPage>({page: "home"});
    const [connectionsData, setConnectionsData] = useState<ConnectionsData>();
    const panelSelection = useMemo<PanelSelection>(() => {
        if (chosenPage.page === 'connection') {
            return { selected: 'connection', connectionId: chosenPage.connectionId };
        } else if (chosenPage.page === 'topic') {
            return { selected: 'topic', connectionId: chosenPage.connectionId, topicName: chosenPage.topicName };
        }
        return { selected: chosenPage.page };
    }, [chosenPage]);

    useEffect(() => {
        getApi(window).getConfiguration().then(setConfiguration);
      }, []);

    const onPanelEvent = async (e: PanelEvent): Promise<void> => {
        if (e.type === "menu") {
            setChosenPage({ page: e.action });
        }
        if (e.type === 'connection') {
            setChosenPage({ page: "connection", connectionId: e.connectionId });
            if (e.action === 'connect') {
                loadConnectionData(e.connectionId);
            }
        }
        if (e.type === 'topic') {
            setChosenPage({ page: "topic", connectionId: e.connectionId, topicName: e.topicName });
        }
    }

    const onConnectionDetailDataFetch = async (connectionId : string): Promise<void> => {
        await loadConnectionData(connectionId);
    }

    const loadConnectionData = async (connectionId: string) => {
        const currentConnectionData = connectionsData?.[connectionId];
        let newConnectionData : ConnectionDataLoading = { status: 'loading' };
        if (currentConnectionData?.status === 'loaded') {
            newConnectionData = {...newConnectionData, previousTopics: currentConnectionData.topics, previousClusterInfo: currentConnectionData.clusterInfo }
        }
        setConnectionsData({...connectionsData, [connectionId]: newConnectionData});
        const response : InstanceInfoResponse = await getApi(window).fetchInstanceInfo( connectionId );
        if (response.result === 'success') {
            setConnectionsData({...connectionsData, [connectionId]: { status: 'loaded', topics: response.topics, clusterInfo: response.clusterInfo }});
        } else {
            setConnectionsData({...connectionsData, [connectionId]: { status: 'error', message: response.message }});
        }
    }

    if (!configuration) {
        return <span><FontAwesomeIcon icon={faRefresh} className="fa-spin" /></span>;
    }

    const getClusterInfo = (connectionId: string) => {
        const connectionData = connectionsData[connectionId];
        return connectionData.status === 'loaded' ? connectionData.clusterInfo :
          connectionData.status === 'loading' ? connectionData.previousClusterInfo : undefined;
    }

    const getTopicDetails = (connectionId: string, topic: string) => {
        const connectionData = connectionsData[connectionId];
        return connectionData.status === 'loaded' ? connectionData.topics[topic] :
          connectionData.status === 'loading' ? connectionData.previousTopics?.[topic] || {partitions: []} : {partitions: []};
    }

    return <div style={{display: 'flex', flexDirection: "row", height: "100vh"}}>
        <Panel 
            connections={configuration?.connections}
            selection={panelSelection}
            connectionsData={connectionsData}
            onPanelEvent={onPanelEvent}
        />
        <div style={{flexGrow: "1", padding: "1rem 1rem 1rem 1rem", backgroundColor: "#F6F6F6"}}>
            {chosenPage.page == "home" ? <ConnectionList
                configuration={configuration}
                onCreateConnection={() => setChosenPage({ page: "new-connection" })}
            /> : null}
            {chosenPage.page == "new-connection" ? <NewConnection
            /> : null}
            {chosenPage.page == "connection" ? <ConnectionDetail
                key={`detail-${chosenPage.connectionId}`}
                connection={configuration.connections.find(c => c.id === chosenPage.connectionId)}
                data={connectionsData?.[chosenPage.connectionId]}
                onFetchData={() => onConnectionDetailDataFetch(chosenPage.connectionId)}
            /> : null}
            {chosenPage.page == "topic" ? <TopicDetail
                key={ `detail-${chosenPage.connectionId}-${chosenPage.topicName}` }
                topic={{connectionId: chosenPage.connectionId, topicName: chosenPage.topicName }}
                topicDetails={getTopicDetails(chosenPage.connectionId, chosenPage.topicName)}
                clusterInfo={getClusterInfo(chosenPage.connectionId)}
                onAdminChange={(stayOnTopic) => {
                    //setActiveSelection({selection: {connectionId: activeSelection.selection.connectionId}, state: "connected"});
                }}
            />: null}
        </div>
    </div>;
}
export default App;