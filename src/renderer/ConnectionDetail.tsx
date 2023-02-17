import React from "react";
import { ClusterInfo, ConnectionDetails } from "../types/types";
import { ConnectionData } from "./Types";
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type Props = {
    connection: ConnectionDetails,
    data: ConnectionData | undefined,
    onFetchData: () => void,
};

const ConnectionDetail = ( props: Props) => {

    const connect = <div style={{flexGrow: "1", textAlign: "right"}}>
        <h1><FontAwesomeIcon icon={faRefresh} title={"Refresh"} size="sm" onClick={props.onFetchData} className={props.data?.status === "loading" ? "fa-spin" : ""} /></h1>
    </div>;

    return <div style={{flexGrow: "1", padding: "1rem 1rem 1rem 1rem"}}>
        <div style={{display: "flex", flexDirection: "row"}}><div><h1>{props.connection.name}</h1></div>{connect}</div>
        <div style={{display: "flex", flexDirection: "row", height: "1.6rem"}}>
            <div style={{flex: "1 0 25%", backgroundColor: "red"}}>ClusterInfo:</div>
            {props.data?.status === "loaded" ? <div style={{flex: "3 1 75%"}}><InstanceInfo info={props.data.clusterInfo} /></div> : null}
        </div>
        <div style={{display: "flex", flexDirection: "row", height: "1.6rem", marginTop: "2rem"}}>
            <div style={{flex: "1 0 25%", backgroundColor: "red"}}>Topics:</div>
            {props.data?.status === "loaded" ? <div style={{flex: "3 1 75%"}}><Topics topics={props.data.topics} /></div> : null}
        </div>
    </div>;
}

const Topics = ( props: {topics: string[]} ) => {
    return <div style={{display: "flex", flexDirection: "column"}}>{props.topics.map(t => <div>{t}</div>)}</div>;
}

const InstanceInfo = ( props: {info: ClusterInfo} ) => {
    
    const brokerLine = (brokerLine : {nodeId: number; host: string; port: number}) => {
        return <div style={{display: "flex", flexDirection: "row"}}><div style={{flex: "1"}}>{brokerLine.host}</div><div style={{flex: "1"}}>{brokerLine.port}</div><div style={{flex: "1"}}>{brokerLine.nodeId}</div></div>
    }

    return <div>{props.info.brokers.map(brokerLine)}</div>;
}

export default ConnectionDetail;