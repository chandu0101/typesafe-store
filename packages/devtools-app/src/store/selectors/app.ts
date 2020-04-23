import { createSelector, Action } from "@typesafe-store/store";
import { AppState } from "..";
import reducerTypes from "../reducers/types";
import devToolsServerTypes from "../apis/websockets/devtools-server/types";




const routeSelector = createSelector((state: AppState): reducerTypes.app.Route => state.app.route)

const appNameSelector = createSelector((state: AppState): string => state.app.appName)


const appNamesSelector = createSelector((state: AppState): string[] => Object.keys(state.app.appsData))

const devToolsMessageSelector = createSelector((state: AppState): devToolsServerTypes.operations.GetMessage => state.app.wsMessage)


const actionsSelector = createSelector((state: AppState): Action[] => {
    const appName = state.app.appName
    return appName.length ? state.app.appsData[appName].actions : []
})