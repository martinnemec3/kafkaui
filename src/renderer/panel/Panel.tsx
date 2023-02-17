import { faHome, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { ConnectionDetails } from '../../types/types';
import { ConnectionsData } from '../Types';
import Connection from './Connection'

export type PanelSelection = { selected: "home" | "new-connection" } |
                             { selected: "connection", connectionId: string } |
                             { selected: "topic", connectionId: string, topicName?: string }


export type PanelEvent = { type: "connection", action: "select" | "connect", connectionId: string } |
                         { type: "topic", action: "select", connectionId: string, topicName: string } |
                         { type: "menu", action: "home" | "new-connection" }

type PanelProps = {
    connections?: ConnectionDetails[],
    selection: PanelSelection;
    connectionsData?: ConnectionsData;
    onPanelEvent : (e: PanelEvent) => void;
}
const Panel = (props : PanelProps) => {

    return <div style={{flex: "0 0 25%", minWidth: "10rem", maxWidth: "20rem", height: "100vh", maxHeight: "100vh", overflowY: "auto", backgroundColor: "#ececec"}}>
        <div style={{ padding: "1rem 1rem 1rem 1rem", textAlign: "left", borderBottom: "1px solid #C3C3C3", color: "#7A7A7A", display: "flex", "flexDirection": "row" }}>
            <span onClick={() => props.onPanelEvent({ type: "menu", action: "home" })} style={{cursor: "pointer"}}>
                <FontAwesomeIcon icon={faHome} title={"Show Home Page"} size="lg" />
            </span>
            <span onClick={() => props.onPanelEvent({ type: 'menu', action: "new-connection" })} style={{cursor: "pointer"}}>
                <FontAwesomeIcon icon={faPlusCircle} title={"Add new connection"} size="lg" />
            </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column"}}>
        {(props.connections || []).map((connection : ConnectionDetails) => {
            const chosen = (props.selection.selected === "connection" || props.selection.selected === "topic") && props.selection.connectionId === connection.id;
            return <Connection
                key={`connection-${connection.id}`}
                connection={connection}
                chosen={chosen}
                chosenTopic={props.selection?.selected === "topic" ? props.selection.topicName : undefined}
                connectionData={props.connectionsData?.[connection.id]}
                onSelectConnection={() => props.onPanelEvent({ type: 'connection', action: 'select', connectionId: connection.id })}
                onSelectTopic={(topicName: string) => props.onPanelEvent({ type: 'topic', action: 'select', connectionId: connection.id, topicName })}
                onConnect={() => props.onPanelEvent({ type: "connection", action: "connect", connectionId: connection.id })}
            />})}
        </div>
    </div>
}

export default Panel;