
           // this file is auto generated on 2020-04-22T06:40:25.796Z, don't modify it
           import {Selector,SelectorE} from "@typesafe-store/store"
           import { createSelector, Action } from "@typesafe-store/store";
import { AppState } from "../..";
import reducerTypes from "../../reducers/types";
import devToolsServerTypes from "../../apis/websockets/devtools-server/types";
export const routeSelector:Selector<AppState,reducerTypes.app.Route> = {fn:(state: AppState): reducerTypes.app.Route => state.app.route,dependencies:{"app":["route"]}}
export const appNameSelector:Selector<AppState,string> = {fn:(state: AppState): string => state.app.appName,dependencies:{"app":["appName"]}}
export const appNamesSelector:Selector<AppState,string[]> = {fn:(state: AppState): string[] => Object.keys(state.app.appsData),dependencies:{"app":["appsData"]}}
export const devToolsMessageSelector:Selector<AppState,devToolsServerTypes.operations.GetMessage> = {fn:(state: AppState): devToolsServerTypes.operations.GetMessage => state.app.wsMessage,dependencies:{"app":["wsMessage"]}}

          