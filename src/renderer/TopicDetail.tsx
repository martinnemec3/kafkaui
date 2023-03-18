import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useState } from 'react'
import { Badge, Card, Nav, Tab, TabContainer, Table, Tabs } from 'react-bootstrap';
import { ClusterInfo, ConnectionDetails, GroupDescription, KavkaMessage, ListGroupsResponse, PartitionDetails, RemoveTopicsResponse, StartConsumptionResponse, TopicDetails } from '../types/types';
import { getApi } from './helper';
import MessagesTable from './MessagesTable';

type Props = {
    topic : {connectionId: string, topicName: string },
    topicDetails: TopicDetails,
    clusterInfo: ClusterInfo,
    onAdminChange : (stayOnTopic : boolean) => void;
};
const TopicDetail = (props : Props) => {
    const [messages, setMessages] = useState<KavkaMessage[] | null | undefined>();
    const [groups, setGroups] = useState<ListGroupsResponse | null | undefined>();

    useEffect(() => {
        getApi(window).listGroups(props.topic.connectionId, props.topic.topicName)
            .then((response : ListGroupsResponse) => {
                console.log("GROUPS: ", response);
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
        const response : RemoveTopicsResponse = await getApi(window).removeTopics(props.topic.connectionId, [props.topic.topicName]);
        if (response.result === 'success') {
            props.onAdminChange(false);
        } else {
            alert(response.message);
        }
    }

    if (!props.topic) {
        return <div style={{flex: "75%", padding: "1rem 1rem 1rem 1rem"}} />;
    }

    const remove = <div style={{flexGrow: "1", textAlign: "right", cursor: "pointer"}}>
        <h1><FontAwesomeIcon icon={faTrashAlt} title={"Remove Topic"} size="sm" onClick={onRemoveTopic} /></h1>
    </div>;

    return <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0}}>
        <div style={{display: "flex", flexDirection: "row"}}><div><h1>{props.topic.topicName}</h1></div>{remove}</div>
        <div style={{flexGrow: "1", display: "flex", flexDirection: "column", minHeight: 0}}>
        <TabContainer defaultActiveKey="messages">
            <Nav variant="pills" className="mb-3">
                <Nav.Item>
                    <Nav.Link eventKey="messages">Messages</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="consumerGroups">Consumer Groups</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="partitions">{`Partitions (${props.topicDetails.partitions.length})`}</Nav.Link>
                </Nav.Item>
            </Nav>
            <Tab.Content style={{flexGrow: "1", display: "flex", flexDirection: "column", minHeight: 0}}>
                <Tab.Pane key="messages" eventKey="messages" style={{height: "100%"}}>
                    <Messages topic={props.topic} />
                </Tab.Pane>
                <Tab.Pane key="consumerGroups" eventKey="consumerGroups" style={{height: "100%"}}>
                    <ConsumerGroups groups={groups?.result === "success" ? groups.groups : undefined}  />
                </Tab.Pane>
                <Tab.Pane key="partitions" eventKey="partitions" style={{height: "100%"}}>
                    <Partitions details={props.topicDetails} clusterInfo={props.clusterInfo} />
                </Tab.Pane>
            </Tab.Content>
        </TabContainer>
        </div>
    </div>;
/*
    return <div style={{display: "flex", overflow: "clip", flexWrap: "wrap", flexDirection: "column", flex: "75%", padding: "1rem 1rem 1rem 1rem"}}>
        <div style={{display: "flex", flexDirection: "row"}}><div><h2>{props.topic?.connectionId} | {props.topic?.topicName}</h2></div>{remove}</div>
        <span>Partitions: {props.topicDetails.partitions.length} | <span onClick={onRemoveTopic}>remove</span></span>
        <table>
            {props.topicDetails.partitions.map(p => <tr>
                <td>{props.clusterInfo.brokers.find(b => b.nodeId === p.leader).host}</td>
                <td>{p.replicas.map(r => props.clusterInfo.brokers.find(b => b.nodeId === r).host)}</td>
            </tr>)}
        </table>
        <hr />
        <button onClick={onConsumeTopic}>Consume</button>
        {messages === null ? <span>Loading...</span> : null}
        {messages ? <MessagesTable messages={messages} /> : null}
        {groups ? <>
            {groups.result === "success" ? groups.groups.map(g => <div>{g.groupId} - {g.userData}</div>) : null}
        </> : null}
    </div>*/
}

const ConsumerGroups = (props: {groups?: GroupDescription[]}) => {

    const printLine = (group: GroupDescription) => <tr>
        <td>{group.groupId}</td>
        <td>{group.protocol} ({group.protocolType})</td>
        <td>{group.state}</td>
        <td>{group.members.map((member, index) => <>{index === 0 ? null : <br />}<span>{member.clientId} ({member.host})</span></>)}</td>
    </tr>

    return <div style={{height: "100%", width: "100%", display: "flex", flexDirection: "column", gap: "1rem"}}>
        <Card style={{flexGrow: "1", minHeight: 0, display: "flex", flexDirection: "column"}}>
        <Card.Body style={{flexGrow: "1", overflow: "auto"}}>
        <Table>
            <thead>
                <tr>
                    <th>Consumer Group Id</th>
                    <th>Protocol</th>
                    <th>State</th>
                    <th>Members</th>
                </tr>
            </thead>
            <tbody>
                {props.groups === undefined ? <tr><td>Loading...</td></tr> : null}
                {props.groups?.map(printLine)}
            </tbody>
        </Table>
        </Card.Body>
        </Card>
    </div>;
}

const Partitions = (props: {clusterInfo: ClusterInfo, details: TopicDetails}) => {

    const partitions = useMemo(() => props.details.partitions.sort((p1, p2) => p1.partitionId - p2.partitionId), [props.details]);

    const formatReplica = (broker: {nodeId: number, host: string, port: number}) => {
        return <span>{`${broker.host}:${broker.port} (node ${broker.nodeId})`}</span>;
    }

    const replicas = (partitionDetails: PartitionDetails) => {
        let result = null;
        for (const replicaId of partitionDetails.replicas) {
            result = <>
                {result}
                {result === null ? null : <br />}
                {formatReplica(props.clusterInfo.brokers.find(broker => broker.nodeId === replicaId))}
                {partitionDetails.leader === replicaId ? <>&nbsp;<Badge pill bg="primary">Leader</Badge></> : null}
                {partitionDetails.leader !== replicaId && partitionDetails.isr.indexOf(replicaId) > -1 ? <>&nbsp;<Badge pill bg="secondary">In-Sync</Badge></> : null}
                {(partitionDetails.offlineReplicas || []).indexOf(replicaId) > -1 ? <>&nbsp;<Badge pill bg="dark">Offline</Badge></> : null}
            </>
        }
        return result;
    }

    const printLine = (partition: PartitionDetails) => {
        return <tr>
            <td>{partition.partitionId}</td>
            <td>{replicas(partition)}</td>
        </tr>;
    }

    return <div style={{height: "100%", width: "100%", display: "flex", flexDirection: "column", gap: "1rem"}}>
        <Card style={{flexGrow: "1", minHeight: 0, display: "flex", flexDirection: "column"}}>
        <Card.Body style={{flexGrow: "1", overflow: "auto"}}>
        <Table>
            <thead>
                <tr>
                    <th>Partition Id</th>
                    <th>Replicas</th>
                </tr>
            </thead>
            <tbody>
                {partitions.map(printLine)}
            </tbody>
        </Table>
        </Card.Body>
        </Card>
    </div>;
}

const Messages = (props: {topic : {connectionId: string, topicName: string }}) => {

    const [messages, setMessages] = useState<KavkaMessage[]>([]);
    const [listening, setListening] = useState<boolean>(false);

    const consume = async () => {
        setListening(true);
        const response : StartConsumptionResponse = await getApi(window).startConsumption(props.topic.connectionId, props.topic.topicName);
        if (response.result === 'success') {
            setMessages(response.messages);
        }
        setListening(false);
    }

    const printLine = (message: KavkaMessage) => {
        return <tr>
            <td>{message.offset}</td>
            <td>{message.key}</td>
            <td style={{wordBreak: "break-all"}}>{message.value}</td>
        </tr>;
    }

    return <div style={{height: "100%", width: "100%", display: "flex", flexDirection: "column", gap: "1rem"}}>
        <Card style={{height: "100%", minHeight: 0, display: "flex", flexDirection: "column"}}>
        <Card.Body style={{flexGrow: "1", overflow: "auto"}}>
        <Table>
            <thead>
                <tr>
                    <th>Offset</th>
                    <th>Key</th>
                    <th>Value</th>
                </tr>
                {messages.map(m => printLine(m))}
                {!listening ? <tr>
                    <td colSpan={3}>
                        <i style={{cursor: "pointer"}} onClick={consume}><u>Start consumption...</u></i>
                        &nbsp;|&nbsp;<i style={{cursor: "pointer"}} onClick={consume}><u>Start from beginning...</u></i>
                    </td>
                </tr> : null}
                {listening ? <tr><td colSpan={3}>Loading...</td></tr> : null}
            </thead>
            <tbody>
            </tbody>
        </Table>
        </Card.Body>
        </Card>
    </div>;
}

export default TopicDetail;