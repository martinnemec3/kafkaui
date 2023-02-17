import React, { useMemo } from "react";
import { Configuration } from "../../types/types";
import './ConnectionList.css'

type Props = {
    configuration: Configuration,
    onCreateConnection: () => void
}
const ConnectionList = (props: Props) => {

    const connectionTriples = useMemo(() => {
        if (!props.configuration?.connections) {
            return [];
        }
        return props.configuration.connections.reduce((a, value) => {
            if (a.slice(-1)[0].length < 5) {
                a.slice(-1)[0].push(value);
            } else {
                a.push([value]);
            }
            return a;
        }, [[null]]);
    }, [props.configuration]) 

    return <div id="connection-list">
        {connectionTriples.map((triple, i) => {
            return <div key={`triple-${i}`}>
                {triple.map(c => {
                    return <div key={c ? c.id : "new"}>
                        {c ? <div>{c.name}</div> : <div onClick={props.onCreateConnection}>New Connection</div>}
                    </div>
                })}
            </div>
        })}
    </div>;
}

export default ConnectionList;