import React, { useState, useRef } from 'react'
import { useSelector } from '@typesafe-store/react';
import { appNameSelector, appNamesSelector, wsUrlSeelctor } from '../store/selectors/generated/app-gen';
import { useAppDispatch } from '../hooks/app-dispatch';
import { useOnClickOutside } from '../hooks/onclick-outside';
import { FaCog } from "react-icons/fa"



type AppSettingsProps = {};


type AppBarProps = {};

const AppBar: React.FC<AppBarProps> = ({ }) => {
    const appName = useSelector(appNameSelector)
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

    return (
        <div className="app-bar">
            <div className="logo">TypeSafe Store Dev Toolss</div>
            <div className="app-bar__right">
                {appNames.length > 0 && <select value={appName} onChange={handleAppNameChange}>
                    {appNames.map(a => <option key={a} value={a}>{a}</option>)}
                </select>}
                <div onClick={() => setShowSetting(true)} >
                    <FaCog size="20px" title="app-settings" />
                    {showSetting && (<div className="setting-pannel" ref={settingPanelRef}>
                        <input value={newUrl} onChange={handleUrlInputChange} />
                        <button onClick={handleChangeUrlButton}>Change Url</button>
                    </div>)}
                </div>

            </div>
        </div>);
}

export default AppBar;




