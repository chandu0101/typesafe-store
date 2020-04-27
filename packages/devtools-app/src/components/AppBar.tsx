import React, { useState, useRef } from 'react'
import { useSelector } from '@typesafe-store/react';
import { appNameSelector, appNamesSelector, wsUrlSeelctor, appNameAndStatusSeelctor } from '../store/selectors/generated/app-gen';
import { useAppDispatch } from '../hooks/app-dispatch';
import { useOnClickOutside } from '../hooks/onclick-outside';
import { FaCog } from "react-icons/fa"
import devToolsServerTypes from '../store/apis/websockets/devtools-server/types';
import DevToolServerRequestCreator from '../store/apis/websockets/devtools-server/requests';



type AppSettingsProps = {};


type AppBarProps = {};

const AppBar: React.FC<AppBarProps> = ({ }) => {
    const { appName, status } = useSelector(appNameAndStatusSeelctor)
    const appNames = useSelector(appNamesSelector)
    const url = useSelector(wsUrlSeelctor)
    const [showSetting, setShowSetting] = useState(false)
    const [newUrl, SetNewUrl] = useState(url)
    const dispatch = useAppDispatch()
    const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        SetNewUrl(e.target.value)
    }
    console.log("***** AppBar URL : ", url);
    const handleChangeUrlButton = () => {
        setShowSetting(false)
        if (url !== newUrl) {
            dispatch({ group: "AppReducer", name: "setWsUrl", payload: newUrl })
        }
    }
    const settingPanelRef = useRef<HTMLDivElement>()

    useOnClickOutside(settingPanelRef, () => setShowSetting(false))


    const handleAppNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        dispatch({ name: "setAppName", group: "AppReducer", payload: value })
    }

    const handleAppConnectDisConnectClick = () => {
        const sm: devToolsServerTypes.AppConnectDisConnectMessage = {
            kind: "AppConnectDisConnect", appName,
            mode: status === "Connected" ? "close" : "open"
        }
        dispatch({
            name: "wsSendMessage", group: "AppReducer",
            ws: DevToolServerRequestCreator.createSendMessageRequest(sm, url)
        })
        dispatch({
            name: "resetApp", group: "AppReducer", payload: {
                appName, actions: [],
                status: status === "Connected" ? "Disconnected" : "Connected"
            }
        })
    }

    return (
        <div className="app-bar">
            <div className="logo">TypeSafe Store Dev Toolss</div>
            <div className="app-bar__right">
                {appNames.length > 0 ? (<div className="app-bar__right-select-div">
                    <select className="app-bar__right-select" value={appName} onChange={handleAppNameChange}>
                        {appNames.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <button className="app-bar__right-select-div--button" onClick={handleAppConnectDisConnectClick}> {status === "Connected" ? "DisConnect" : "Connect"}</button>
                </div>) : <div className="app-bar__right-noapps"> No Apps Connected </div>}

                <div className="app-bar__right-settings-div" onClick={() => setShowSetting(true)} >
                    <FaCog size="20px" title="app-settings" />
                    {showSetting && (<div className="setting-pannel" ref={settingPanelRef}>
                        <input value={newUrl} placeholder="devtools server url" onChange={handleUrlInputChange} />
                        <button onClick={handleChangeUrlButton}>Change Url</button>
                    </div>)}
                </div>

            </div>
        </div >);
}

export default AppBar;




