import React, { useEffect } from 'react'
import { createGlobalSocketCloseAction } from '@typesafe-store/middleware-websockets';
import DevToolServerRequestCreator from '../store/apis/websockets/devtools-server/requests';
import { useSelector } from '@typesafe-store/react';
import { devToolsMessageSelector } from '../store/selectors/generated/app-gen';
import { useAppDispatch } from '../hooks/app-dispatch';
import devToolsServerTypes from '../store/apis/websockets/devtools-server/types';



type MessageListenerProps = {};

const MessageListener: React.FC<MessageListenerProps> = ({ }) => {

    const wsMessage = useSelector(devToolsMessageSelector)
    const dispatch = useAppDispatch()
    console.log("Rendering :", "MessageListener");
    if (wsMessage.error) {
        console.log("Error from ws :", wsMessage.error);
    } else if (wsMessage.data) {
        console.log("got message :");
        const message = wsMessage.data
        if (message.kind === "AppConnection") {
            dispatch({ group: "AppReducer", name: "initializeApp", payload: message.appName })
        } else if (message.kind == "Action") {
            dispatch({
                group: "AppReducer", name: "addAction",
                payload: { action: message.action, appName: message.appName }
            })
        }
    }

    useEffect(() => {
        const sm: devToolsServerTypes.StartMessage = { kind: "StartMessage", id: "" } // id will be replacesed while sending
        dispatch({
            group: "AppReducer",
            name: "wsMessage",
            ws: DevToolServerRequestCreator.createMessageRequest(sm)
        })

        return () => { // on unmount close connection
            createGlobalSocketCloseAction(DevToolServerRequestCreator.url)
        }
    }, [])
    return (
        <div> </div>);
}

export default MessageListener;