import React, { useState, MouseEvent, useMemo } from 'react';
import { ConnectionDetails } from '../../types/types';
import { faSpinner, faExclamationCircle, faRefresh, faPlug } from '@fortawesome/free-solid-svg-icons'
import { faSquare, faPlusSquare, faMinusSquare } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ConnectionData, ConnectionDataError } from '../Types';

type ConnectionProps = {
    connection: ConnectionDetails;
    chosen: boolean;
    chosenTopic?: string;
    connectionData?: ConnectionData;
    onSelectConnection: () => void;
    onConnect: () => void;
    onSelectTopic: (topicName: string) => void;
}
const Connection = (props : ConnectionProps) => {

    const [hidden, setHidden] = useState<boolean>(false);
    const showConnect = useMemo(() => {
        return props.connectionData === undefined || props.connectionData.status === 'error'
    }, [props.connectionData]);
    const topics = useMemo(() => {
        return props.connectionData?.status === 'loaded' ? props.connectionData.topics.sort() :
        (props.connectionData?.status === 'loading' && props.connectionData.previousTopics ? props.connectionData.previousTopics.sort() : null)
    }, [props.connectionData]);

    const onConnectionClick = (e : MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        props.onSelectConnection();
    }

    const onTopicClick = (e : MouseEvent<HTMLElement>, topicName : string) => {
        e.stopPropagation();
        props.onSelectTopic(topicName);
    }

    const onConnect = (e : MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        props.onConnect();
    }

    const onError = (e : MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        alert((props.connectionData as ConnectionDataError).message);
    }

    return <div style={{padding: "0rem 0rem 0rem 0rem", backgroundColor: props.chosen ? "rgba(200, 200, 255, 0.2)" : 'transparent', borderBottom: "1px solid #C3C3C3"}}>
        <div onClick={onConnectionClick} onDoubleClick={showConnect ? onConnect : () => setHidden(!hidden)} style={{display: "flex", flexDirection: "row", padding: "1rem 1rem 1rem 1rem", backgroundColor: props.chosen ? "#acacff" : "#dedede"}}>
            <div>
                {props.connectionData?.status === 'loaded' ?
                    <span style={{cursor: "pointer"}} onClick={() => setHidden(!hidden)}><FontAwesomeIcon size='xs' icon={hidden ? faPlusSquare : faMinusSquare} /></span> : 
                 props.connectionData?.status === 'loading' ?
                    <span><FontAwesomeIcon size='xs' icon={faSquare} /></span> :
                    <span style={{cursor: "pointer"}} onClick={showConnect ? onConnect : undefined}><FontAwesomeIcon size='xs' icon={faPlug} /></span>
                }
            </div>
            <div style={{flexGrow: "1", padding: "0 0.3rem 0 0.3rem", overflowWrap: "anywhere", userSelect: "none"}}><b style={{cursor: "default", textOverflow: "ellipsis"}}>{props.connection.name}</b></div>
            <div>
                { props.connectionData?.status === 'error' ? <span onClick={onError}><FontAwesomeIcon icon={faExclamationCircle} title={props.connectionData.message} color="red" /></span> : null}
                { props.connectionData?.status === 'loaded' ? <span onClick={onConnect} style={{cursor: "pointer"}}><FontAwesomeIcon icon={faRefresh} title={"Re-Fetch"} /></span> : null}
                { props.connectionData?.status === 'loading' ? <span><FontAwesomeIcon icon={faSpinner} title={"Connecting"} className={"fa-spin"} /></span> : null}
            </div>
        </div>
        {topics && !hidden ? <div style={{display: "flex", flexDirection: "column", padding: "0 0 1rem 0"}}>
            <TopicList topics={topics} chosenTopic={props.chosenTopic} locked={props.connectionData?.status == "loading"} onTopicClick={onTopicClick} />
        </div> : null}
    </div>;
}

const TopicList = (props: {topics: string[], chosenTopic?: string, locked: boolean, onTopicClick: (e : any, topic : string) => void}) => {
    return <>{props.topics.map((t : string) => 
        <div key={`topic-${t}`} style={{display: "flex", flexDirection: "row", padding: "0.3rem 1rem 0.3rem 1rem"}}>
            <div><span><FontAwesomeIcon size='xs' icon={faSquare} color="transparent" /></span></div>
            <div><span
                style={{fontWeight: props.chosenTopic === t ? "bold" : "normal", cursor: "pointer", color: "#434343", overflowWrap: "anywhere"}}
                onClick={(e) => !props.locked ? props.onTopicClick(e, t) : null}>{t}</span></div>
        </div>
    )}</>
}

export default Connection;