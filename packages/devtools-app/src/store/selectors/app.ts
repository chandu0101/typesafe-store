import { createSelector, Action } from "@typesafe-store/store";
import { AppState } from "..";
import reducerTypes from "../reducers/types";
import devToolsServerTypes from "../apis/websockets/devtools-server/types";




const routeSelector = createSelector((state: AppState): reducerTypes.app.Route => state.app.route)

const appNameSelector = createSelector((state: AppState): string => state.app.appName)


const appNamesSelector = createSelector((state: AppState): string[] => {
    const keys = Object.keys(state.app.appsData)
    console.log("keys: ", keys);
    return keys;
})

const wsUrlSeelctor = createSelector((state: AppState): string => state.app.wsUrl)

const devToolsMessageSelector = createSelector((state: AppState): devToolsServerTypes.operations.GetMessage => state.app.wsMessage)


const actionsSelector = createSelector((state: AppState): reducerTypes.app.AppData => {
    let result: reducerTypes.app.AppData = { status: "Disconnected", actions: [], name: "Disconnected" }
    const appName = state.app.appName
    if (appName) {
        result = state.app.appsData[appName]
    }
    return result
})