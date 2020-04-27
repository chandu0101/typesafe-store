
           // this file is auto generated on 2020-04-25T10:32:57.798Z, don't modify it
           import {Selector,SelectorE} from "@typesafe-store/store"
           import { createSelector, Action } from "@typesafe-store/store";
import { AppState } from "../..";
import reducerTypes from "../../reducers/types";
import devToolsServerTypes from "../../apis/websockets/devtools-server/types";
export const routeSelector:Selector<AppState,reducerTypes.app.Route> = {fn:(state: AppState): reducerTypes.app.Route => state.app.route,dependencies:{"app":["route"]}}
export const appNameSelector:Selector<AppState,string> = {fn:(state: AppState): string => state.app.appName,dependencies:{"app":["appName"]}}
export const appNameAndStatusSeelctor:Selector<AppState,{ appName: string, status: reducerTypes.app.AppConnectionStatus }> = {fn:(state: AppState): { appName: string, status: reducerTypes.app.AppConnectionStatus } => {
    const appName = state.app.appName
    let status: reducerTypes.app.AppConnectionStatus = "Disconnected"
    if (appName) {
        status = state.app.appsData[appName].status
    }
    return { appName, status }
},dependencies:{"app":["appName","appsData"]}}
export const appNamesSelector:Selector<AppState,string[]> = {fn:(state: AppState): string[] => {
    const keys = Object.keys(state.app.appsData)
    console.log("keys: ", keys);
    return keys;
},dependencies:{"app":["appsData"]}}
export const wsUrlSeelctor:Selector<AppState,string> = {fn:(state: AppState): string => state.app.wsUrl,dependencies:{"app":["wsUrl"]}}
export const devToolsMessageSelector:Selector<AppState,devToolsServerTypes.operations.GetMessage> = {fn:(state: AppState): devToolsServerTypes.operations.GetMessage => state.app.wsMessage,dependencies:{"app":["wsMessage"]}}
export const actionsSelector:Selector<AppState,reducerTypes.app.AppData> = {fn:(state: AppState): reducerTypes.app.AppData => {
    let result: reducerTypes.app.AppData = { status: "Disconnected", actions: [], name: "Disconnected" }
    const appName = state.app.appName
    if (appName) {
        result = state.app.appsData[appName]
    }
    return result
},dependencies:{"app":["appName","appsData"]}}

          