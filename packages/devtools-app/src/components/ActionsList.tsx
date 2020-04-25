import React, { useState } from 'react'
import { useSelector } from '@typesafe-store/react';
import { actionsSelector } from '../store/selectors/generated/app-gen';
import reducerTypes from '../store/reducers/types';
import JsonTree from "react-json-tree"
import { AppUtils } from '../utils';



type ActionTileProps = {
    action: reducerTypes.app.DAction, status: reducerTypes.app.AppConnectionStatus,
    onGotoAction: (index: number) => any,
    index: number
};



const ActionTile: React.FC<ActionTileProps> = ({ action, status, index, onGotoAction }) => {

    const [showDetails, setShowDetails] = useState(false)
    const [showPayload, setShowPayload] = useState(false)
    const [showStateChanged, setShowStateChanged] = useState(false)
    const actionAny = action as any
    let actionType: reducerTypes.app.DactionType = "Unknown"
    let actionPayload: any = "Unknown Payload"
    if (actionAny.payload) {
        actionType = "Sync"
        actionPayload = actionAny.payload
    } else if (actionAny.fetch) {
        actionType = "Fetch"
        actionPayload = actionAny.fetch
    } else if (actionAny.ws) {
        actionType = "WS"
        actionPayload = actionAny.ws
    } else if (actionAny.promise) {
        actionType = "Promise"
        actionPayload = "PromiseFunc"
    }
    const payload: any | undefined = (action as any).payload

    const actionDetails = () => {

        return (<div className="action-tile-details">
            {showPayload && <p>{JSON.stringify(payload)}</p>}
            {showStateChanged && <p>{JSON.stringify(action.state)}</p>}
            <div className="action-tile-details__buttons">
                <button onClick={(e) => {
                    e.stopPropagation()
                    setShowPayload(!showPayload)
                }}>{showPayload ? "Hide Payload" : "Show Payload"}</button>
                <button onClick={(e) => {
                    e.stopPropagation()
                    setShowStateChanged(!showStateChanged)
                }
                }>
                    {showStateChanged ? "Hide StateChanged" : "Show StateChanged"}
                </button>
                {(status === "Connected") && <button onClick={() => onGotoAction(index)}>Reset App To This Action</button>}
            </div>
        </div>)
    }

    return (
        <div className="action-tile" onClick={() => setShowDetails(!showDetails)}>
            <div className="action-tile__title">
                <div>{actionType}</div>
                <div>{action.group}.{action.name}</div>
            </div>
            {showDetails && actionDetails()}
        </div>);
}



type ActionsListProps = { appData: reducerTypes.app.AppData, resetState: (index: number) => any };

const ActionsListI: React.FC<ActionsListProps> = ({ appData, resetState }) => {
    console.log("rendering action list");
    let state = {}
    if (appData.actions.length > 0) {
        state = AppUtils.getStateFromAction(appData, appData.actions.length - 1)
    }
    const { actions, status } = appData
    return (
        <div className="actions-container">
            <div className="actions-container__list">
                {actions.map((a, i) => <ActionTile key={`${a.group}-${a.name}=${i}`}
                    status={status}
                    action={a} index={i} onGotoAction={resetState} />)}
            </div>
            <div className="actions-container__state">
                <JsonTree data={state} />
            </div>
        </div>);
}


export default React.memo(ActionsListI)