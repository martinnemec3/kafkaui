import React, { useState, useEffect, ChangeEvent } from "react";

const NewConnection = () => {

    const [connectionName, setConnectionName] = useState<string>("");
    const [servers, setServers] = useState<string[]>([""]);
    const [ssl, setSsl] = useState<boolean>(false);
    const [authentication, setAuthentication] = useState<"none" | "mTLS">("none");

    useEffect(() => {
        if (!ssl) setAuthentication("none");
    }, [ssl]);

    useEffect(() => {
        if (authentication === "mTLS") setSsl(true);
    }, [authentication]);

    const onConnectionNameChange = (e : ChangeEvent<HTMLInputElement>) => {
        setConnectionName(e.currentTarget.value);
    }

    const onSSLChange = () => {
        setSsl(!ssl);
    }

    const onServersChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const newArray = [...servers];
        newArray[index] = e.currentTarget.value;
        setServers(newArray);
    }

    const onAddServer = () => {
        setServers([...servers, ""]);
    }

    const onAuthenticationChange = (e : ChangeEvent<HTMLSelectElement>) => {
        setAuthentication(e.currentTarget.value as "none" | "mTLS")
    }

    return <div style={{display: "flex", flexDirection: "column"}}>
        <div style={{display: "flex", flexDirection: "row"}}>New Connection</div>
        <div style={{display: "flex", flexDirection: "row"}}>Connection Name: <div className="field"><input type="text" value={connectionName} onChange={onConnectionNameChange} /></div></div>
        <div style={{display: "flex", flexDirection: "row"}}>Servers: {servers.map((s, i) => <input value={s} onChange={e => onServersChange(e, i)} />)}
            <br /><button onClick={onAddServer}>ADD Another</button>
        </div>
        <div style={{display: "flex", flexDirection: "row"}}>SSL: <input type="checkbox" checked={ssl} onChange={onSSLChange} /></div>
        {ssl ? <>
        <div style={{display: "flex", flexDirection: "row"}}>Ignore untrusted: <input type="checkbox" /></div>
        <div style={{display: "flex", flexDirection: "row"}}>Certificate: <input /></div>
        </> : null}
        <div style={{display: "flex", flexDirection: "row"}}>Authentication: <select value={authentication} onChange={onAuthenticationChange}>
            <option>none</option><option>mTLS</option>
        </select></div>
        {authentication === "mTLS" ? <>
            <div style={{display: "flex", flexDirection: "row"}}>Key: <input /></div>
            <div style={{display: "flex", flexDirection: "row"}}>Certificate: <input /></div>
        </> : null}
        
    </div>;
}

export default NewConnection;