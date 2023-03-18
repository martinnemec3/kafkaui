import React, { ChangeEvent, useMemo, useState } from "react";
import { ClusterInfo, ConnectionDetails, CreateTopicData, TopicDetails } from "../types/types";
import { ConnectionData } from "./Types";
import { faRefresh, faPlusSquare, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge, Button, Card, Col, Form, InputGroup, Modal, Nav, Row, Tab, TabContainer, Table, Tabs } from "react-bootstrap";
import AddTopicModal from "./AddTopicModal";
import { getApi } from "./helper";
import { useEffect } from "react";
import RemoveTopicsModal from "./RemoveTopicsModal";

type Props = {
    connection: ConnectionDetails,
    data: ConnectionData | undefined,
    onFetchData: () => void,
};

const ConnectionDetail = ( props: Props) => {

    const clusterInfo = useMemo(() => props.data?.status === "loaded" ? props.data.clusterInfo : undefined, [props.data]);
    const topics = useMemo(() => props.data?.status === "loaded" ? props.data.topics : undefined, [props.data]);
    const [addTopicModalId, setAddTopicModalId] = useState<string | undefined>();
    const [removeModalTopics, setRemoveModalTopics] = useState<string[] | undefined>();

    const onAddTopic = (data: CreateTopicData) => {
        getApi(window).createTopic(props.connection.id, data)
            .then(response => {
                if (response.result === "success") {
                    setAddTopicModalId(undefined);
                    props.onFetchData();
                } else {
                    alert(response.message);
                }
            });
    }

    const onRemoveTopics = (topics: string[]) => {
        getApi(window).removeTopics(props.connection.id, topics)
            .then(response => {
                if (response.result === "success") {
                    setRemoveModalTopics(undefined);
                    props.onFetchData();
                } else {
                    alert(response.message);
                }
            });
    }

    const connect = <div style={{flexGrow: "1", textAlign: "right", cursor: "pointer"}}>
        <h2>
            <FontAwesomeIcon icon={faRefresh} title={"Refresh"} size="sm" onClick={props.onFetchData} className={props.data?.status === "loading" ? "fa-spin" : ""} />
        </h2>
    </div>;

    return <>
    <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0}}>
        <div style={{display: "flex", flexDirection: "row"}}><div><h1>{props.connection.name}</h1></div>{connect}</div>
        <div style={{flexGrow: "1", display: "flex", flexDirection: "column", minHeight: 0}}>
            <TabContainer defaultActiveKey="setup">
                <Nav variant="pills" className="mb-3">
                    <Nav.Item>
                        <Nav.Link eventKey="setup">Setup</Nav.Link>
                    </Nav.Item>
                    {props.data?.status === "loaded" ? <>
                    <Nav.Item>
                        <Nav.Link eventKey="cluster-info">Cluster Info</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="topics">{`Topics (${topics ? Object.keys(topics).length : "?" })`}</Nav.Link>
                    </Nav.Item>
                    </> : null}
                </Nav>
                <Tab.Content style={{flexGrow: "1", display: "flex", flexDirection: "column", minHeight: 0}}>
                    <Tab.Pane key="setup" eventKey="setup" style={{height: "100%"}}>
                        <ConnectionSetup connection={props.connection} />
                    </Tab.Pane>
                    <Tab.Pane key="cluster-info" eventKey="cluster-info" style={{height: "100%"}}>
                        <InstanceInfo info={clusterInfo} />
                    </Tab.Pane>
                    <Tab.Pane key="topics" eventKey="topics" style={{height: "100%"}}>
                        <Topics topics={topics} onAddTopic={() => setAddTopicModalId(Date.now().toString())} onDeleteTopics={setRemoveModalTopics} />
                    </Tab.Pane>
                </Tab.Content>
            </TabContainer>
        </div>
    </div>
    <AddTopicModal
        key={addTopicModalId}
        show={!!addTopicModalId}
        clusterInfo={clusterInfo}
        onAddTopic={onAddTopic}
        onClose={() => setAddTopicModalId(undefined)} />
    <RemoveTopicsModal
        key={removeModalTopics?.toString()}
        show={!!removeModalTopics}
        topics={removeModalTopics}
        onRemoveTopics={onRemoveTopics}
        onClose={() => setRemoveModalTopics(undefined)} />
    </>;
}

const Topics = ( props: {topics: {[topic: string]: TopicDetails}, onAddTopic: () => void, onDeleteTopics: (topics: string[]) => void} ) => {

    const topics = useMemo(() => Object.entries(props.topics || {})
                                        .reduce((accumulator, [name, details]) => [...accumulator, {name, details}], [])
                                        .sort((a, b) => a.name.localeCompare(b.name)), [props.topics]);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        const newSelected = topics.map(t => t.name).filter(topicName => selected.indexOf(topicName) > -1);
        setSelected(newSelected);
    }, [topics]);

    const onCheck = (event: ChangeEvent<HTMLInputElement>, name: string) => {
        const index = selected.indexOf(name);
        if (index === -1) {
            setSelected([...selected, name]);
        } else {
            const newSelected = [...selected];
            newSelected.splice(index, 1);
            setSelected(newSelected);
        }
    }

    const onCheckAll = () => {
        if (selected.length === topics.length && topics.length > 0) {
            setSelected([]);
        } else {
            setSelected(topics.map(t => t.name));
        }
    }

    const printLine = (t : {name: string, details: TopicDetails}) => <tr key={`topics__${t.name}`}>
        <td><Form.Check type="checkbox" checked={selected.indexOf(t.name) > -1} onChange={(e) => onCheck(e, t.name)} /></td>
        <td>{t.name}</td>
        <td>{t.details.partitions.length}</td>
    </tr>
    
    return <div style={{height: "100%", width: "100%", display: "flex", flexDirection: "column", gap: "1rem"}}>
    <Card style={{height: "100%", minHeight: 0, display: "flex", flexDirection: "column"}}>
        <Card.Header>
            <Row>
                <Col sm={10} style={{display: "flex", flexDirection: "row"}}>
                    <Form.Label style={{whiteSpace: "nowrap", paddingTop: "0.3rem", marginRight: "1rem"}}>Filter results:</Form.Label>
                    <Form.Control type="text" placeholder="Search..." size="sm" />
                </Col>
                <Col sm={2} className="text-end">
                    <span>
                        <FontAwesomeIcon icon={faPlusSquare} title={"Create Topic"} size="2xl" onClick={props.onAddTopic} style={{cursor: "pointer"}} />
                    </span>&nbsp;<span>
                        {selected?.length ?
                            <FontAwesomeIcon icon={faTrashAlt} title={`Delete Topic${selected.length > 1 ? "s" : ""}`} size="2xl" onClick={() => props.onDeleteTopics(selected)} style={{cursor: "pointer"}} /> :
                            <FontAwesomeIcon icon={faTrashAlt} title={"Delete Topics"} size="2xl" style={{color: "grey"}} />}
                    </span>
                </Col>
            </Row>
        </Card.Header>
        <Card.Body style={{flexGrow: "1", overflow: "auto"}}>
            <Table>
                <thead>
                    <tr>
                        <th>
                            <Form.Check type="checkbox"
                                checked={selected.length === topics.length && topics.length > 0}
                                onChange={onCheckAll} />
                        </th>
                        <th>Topic Name</th>
                        <th>Partitions Count</th>
                    </tr>
                </thead>
                <tbody>
                    {topics.map(printLine)}
                </tbody>
            </Table>
        </Card.Body>
    </Card>
    </div>;
}

const InstanceInfo = ( props: {info: ClusterInfo} ) => {

    const brokers = useMemo(() => (props.info?.brokers || []).sort((a, b) => a.nodeId - b.nodeId), [props.info]);
    
    const brokerLine = (brokerLine : {nodeId: number; host: string; port: number}) => {
        return <tr key={`brokers__${brokerLine.nodeId}`}>
            <td>{brokerLine.nodeId == props.info.controller ? <Badge bg="secondary">Controller</Badge> : null}</td>
            <td>{brokerLine.nodeId}</td>
            <td>{brokerLine.host}</td>
            <td>{brokerLine.port}</td>
        </tr>
    }

    return <div style={{height: "100%", width: "100%", display: "flex", flexDirection: "column", gap: "1rem"}}>
        <Card style={{flexGrow: "1", minHeight: 0, display: "flex", flexDirection: "column"}}>
            <Card.Body style={{flexGrow: "1", overflow: "auto"}}>
                <Table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>Node Id</th>
                            <th>Host</th>
                            <th>Port</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brokers?.map(brokerLine)}
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    </div>;
}

const ConnectionSetup = ( props: {connection: ConnectionDetails} ) => {

    return <div style={{height: "100%", width: "100%", display: "flex", flexDirection: "column", gap: "1rem"}}>
        <Card style={{flexGrow: "1", minHeight: 0, display: "flex", flexDirection: "column"}}>
            <Card.Body style={{flexGrow: "1", overflow: "auto"}}>
                <Table>
                    <tbody>
                        <tr>
                            <td>Name</td>
                            <td>{props.connection?.name}</td>
                        </tr>
                        <tr>
                            <td>Servers</td>
                            <td>{props.connection?.servers}</td>
                        </tr>
                        <tr>
                            <td>SSL</td>
                            <td>{props.connection?.ssl !== undefined ? "true" : "false"}</td>
                        </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    </div>;
}

export default ConnectionDetail;