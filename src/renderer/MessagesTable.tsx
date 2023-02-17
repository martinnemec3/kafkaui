import React, { useState } from 'react'
import { KavkaMessage } from '../types/types';

const MessageLine = (props : {message: KavkaMessage, columns: string[], addColumns : (columns : string[]) => void}) => {

    const getCol = (col : string) => {
        try {
            const parsed = JSON.parse(props.message.value?.toString());
            return <>{JSON.stringify(parsed?.[col])}</>;
        } catch (e) {
            return null;
        }
    }

    return <tr onClick={() => props.addColumns(Object.keys(JSON.parse(props.message.value?.toString())))}>
          <td>{props.message.partition}</td>
          <td>{JSON.stringify(props.message.offset)}</td>
          <td>{props.message.key?.toString()}</td>
          <td style={{whiteSpace: "nowrap"}}>{props.message.value?.toString()}</td>
          {props.columns ? 
            props.columns.map(col => <td>{getCol(col)}</td>) : null}
        </tr>
}

const MessagesTable = (props : {messages: KavkaMessage[] | undefined}) => {

    const [columns, setColumns] = useState(undefined);

    const addColumns = (columns : string[]) => {
        setColumns(columns);
    }

    const renderBody = () => {
        if (!props.messages) {
            return <tr><td colSpan={3}>Loading messages...</td></tr>
        }
        return props.messages.map((message : KavkaMessage) => <MessageLine key={message.offset} message={message} columns={columns} addColumns={addColumns} />);
        
    }

    return <div style={{overflow: "scroll", flex: 1}}>
        <table cellSpacing={0}>
            <thead style={{backgroundColor: "#DCDCDC", position: "sticky", top: "0px", left: "0px"}}><tr><th>Partition</th><th>Offset</th><th>Key</th><th>Value</th>{
                columns ? columns.map((col : string) => <th>{col}</th>) : null
            }</tr></thead>
            <tbody>{renderBody()}</tbody>
        </table>
    </div>;

}

export default MessagesTable;