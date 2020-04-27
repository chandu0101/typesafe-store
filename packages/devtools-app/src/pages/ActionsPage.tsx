import React, { useCallback } from 'react'
import { useSelector, useDispatch } from '@typesafe-store/react';
import { actionsSelector, wsUrlSeelctor } from '../store/selectors/generated/app-gen';
import { useAppDispatch } from '../hooks/app-dispatch';
import devToolsServerTypes from '../store/apis/websockets/devtools-server/types';
import { DEVTOOL_MIDDLEWARE_SERVER_ACTION_GROUP } from '../constants';
import reducerTypes from '../store/reducers/types';
import DevToolServerRequestCreator from '../store/apis/websockets/devtools-server/requests';
import { AppUtils } from '../utils';
import ActionsList from '../components/ActionsList';


type ActionsPageProps = {};




const ActionsPage: React.FC<ActionsPageProps> = ({ }) => {
    const appData = useSelector(actionsSelector)
    const wsUrl = useSelector(wsUrlSeelctor)
    const dispatch = useAppDispatch()
    console.log("*************** Rendering : ActionsPage", appData.actions.length);
    const changeState = useCallback((index: number) => {
        console.log("********** ActionsPage", index);
        const newState = AppUtils.getStateFromAction(appData, index)
        const am: devToolsServerTypes.ActionMessage = {
            kind: "Action",
            appName: appData.name,
            id: "",
            action: { group: DEVTOOL_MIDDLEWARE_SERVER_ACTION_GROUP, name: "replaceState" }, stateChanged: newState
        }
        dispatch({
            name: "wsSendMessage", group: "AppReducer",
            ws: DevToolServerRequestCreator.createSendMessageRequest(am, wsUrl)
        })
        dispatch({ name: "resetApp", group: "AppReducer", payload: { appName: appData.name, actions: appData.actions.slice(0, index), status: "Connected" } })
    }, [appData])


    return (
        <ActionsList appData={appData} resetState={changeState} />);
}

export default ActionsPage;


