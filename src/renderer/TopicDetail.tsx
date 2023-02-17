import { ITopicMetadata } from 'kafkajs';
import React, { useEffect, useState } from 'react'
import { KavkaMessage, ListGroupsResponse, ListTopicMetadataResponse, RemoveTopicResponse, StartConsumptionResponse } from '../types/types';
import { getApi } from './helper';
import MessagesTable from './MessagesTable';

type Props = {
    topic : {connectionId: string, topicName: string },
    onAdminChange : (stayOnTopic : boolean) => void;
};
const TopicDetail = (props : Props) => {

    const [topicMetadata, setTopicMetadata] = useState<ITopicMetadata | undefined>();
    const [messages, setMessages] = useState<KavkaMessage[] | null | undefined>();
    const [groups, setGroups] = useState<ListGroupsResponse | null | undefined>();

    useEffect(() => {
        setTopicMetadata(undefined);
        getApi(window).listTopicMetadata(props.topic.connectionId, props.topic.topicName)
            .then((topicMetadata : ListTopicMetadataResponse) => {
                if (topicMetadata.result === "success") {
                    setTopicMetadata(topicMetadata.topicMetadata)
                } else {
                    alert(topicMetadata.message);
                }
            });
        getApi(window).listGroups(props.topic.connectionId, props.topic.topicName)
            .then((response : ListGroupsResponse) => {
                setGroups(response);
            });
    }, [props.topic]);

    const onConsumeTopic = async () => {
        setMessages(null);
        const result: StartConsumptionResponse = await getApi(window).startConsumption(props.topic.connectionId, props.topic.topicName);
        if (result.result === 'success') {
            setMessages(result.messages);
        } else {
            setMessages(undefined)
            alert(result.message);
        }
    }

    const onRemoveTopic = async () => {
        const response : RemoveTopicResponse = await getApi(window).removeTopic(props.topic.connectionId, props.topic.topicName);
        if (response.result === 'success') {
            props.onAdminChange(false);
        } else {
            alert(response.message);
        }
    }

    if (!props.topic) {
        return <div style={{flex: "75%", padding: "1rem 1rem 1rem 1rem"}} />;
    }

    return <div style={{display: "flex", overflow: "clip", flexWrap: "wrap", flexDirection: "column", flex: "75%", padding: "1rem 1rem 1rem 1rem"}}>
        <h2>{props.topic?.connectionId} | {props.topic?.topicName}</h2>
        {!topicMetadata && props.topic ? <span>Loading...</span> : null}
        {topicMetadata ? <>
            <span>Partitions: {topicMetadata.partitions.length} | <span onClick={onRemoveTopic}>remove</span></span>
            <hr />
            <button onClick={onConsumeTopic}>Consume</button>
            {messages === null ? <span>Loading...</span> : null}
            {messages ? <MessagesTable messages={messages} /> : null}
            </> : null}
        {groups ? <>
            {groups.result === "success" ? groups.groups.map(g => <div>{g.groupId} - {g.userData}</div>) : null}
        </> : null}
    </div>
}
export default TopicDetail;