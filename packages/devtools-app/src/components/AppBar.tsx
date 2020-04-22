import React from 'react'
import { useSelector } from '@typesafe-store/react';
import { appNameSelector, appNamesSelector } from '../store/selectors/generated/app-gen';
import { useAppDispatch } from '../hooks/app-dispatch';



type AppBarProps = {};

const AppBar: React.FC<AppBarProps> = ({ }) => {
    const appName = useSelector(appNameSelector)
    const appNames = useSelector(appNamesSelector)
    const dispatch = useAppDispatch()

    const handleAppNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        dispatch({ name: "setAppName", group: "AppReducer", payload: value })
    }

    return (
        <div className="app-bar">
            <div>TypeSafe Store Dev Toolss</div>
            <div>
                {appNames.length && <select value={appName.length} onChange={handleAppNameChange}>
                    {appNames.map(a => <option key={a} value={a}>a</option>)}
                </select>}
            </div>
        </div>);
}

export default AppBar;




