import React, { useEffect } from 'react'
import { createGlobalSocketCloseAction } from '@typesafe-store/middleware-websockets';
import DevToolServerRequestCreator from '../store/apis/websockets/devtools-server/requests';
import { useSelector } from '@typesafe-store/react';
import { devToolsMessageSelector, wsUrlSeelctor } from '../store/selectors/generated/app-gen';
import { useAppDispatch } from '../hooks/app-dispatch';
import devToolsServerTypes from '../store/apis/websockets/devtools-server/types';



type MessageListenerProps = {};

const MessageListener: React.FC<MessageListenerProps> = ({ }) => {

    const url = useSelector(wsUrlSeelctor)
    const wsMessage = useSelector(devToolsMessageSelector)
    const dispatch = useAppDispatch()
    console.log("Rendering :", "MessageListener");
    if (wsMessage.error) {
        console.log("Error from ws :", wsMessage.error);
    } else if (wsMessage.data) {
        const message = wsMessage.data
        console.log("got message :", message);
        if (message.kind === "InitiateAppConnection") {
            console.log("dispatching AppConnection action", message.appName);
            dispatch({ group: "AppReducer", name: "initializeApp", payload: message.appName })
        } else if (message.kind === "AppClose") {
            dispatch({ group: "AppReducer", name: "resetApp", payload: { appName: message.appName, actions: [], status: "Disconnected" } })
        }
        else if (message.kind == "Action") {
            dispatch({
                group: "AppReducer", name: "addAction",
                payload: { action: { ...message.action, state: message.stateChanged }, appName: message.appName }
            })
        }
    }

    useEffect(() => {
        const sm: devToolsServerTypes.StartMessage = { kind: "StartMessage", id: "" } // id will be replacesed while sending
        dispatch({
            group: "AppReducer",
            name: "wsMessage",
            ws: DevToolServerRequestCreator.createMessageRequest(sm, url)
        })

        return () => { // on unmount close connection
            dispatch(createGlobalSocketCloseAction(url))
        }
    }, [url])
    return (
        <div> </div>);
}

export default MessageListener;