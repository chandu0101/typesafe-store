import { Action } from "@typesafe-store/store"
import reducerTypes from "./types"
import devToolsServerTypes from "../apis/websockets/devtools-server/types"



class AppReducer {


    route: reducerTypes.app.Route = "actions"

    appName: reducerTypes.app.AppName = ""

    appsData: Record<reducerTypes.app.AppName, reducerTypes.app.AppData> = {}

    wsMessage: devToolsServerTypes.operations.GetMessage = {}

    setAppName(name: string) {
        this.appName = name
    }

    setRoute(route: reducerTypes.app.Route) {
        this.route = route
    }


    initializeApp(appName: string) {
        this.appName = appName
        this.appsData[appName] = { actions: [], state: null }
    }

    addAction(appName: string, action: Action) {
        this.appsData[appName].actions.push(action)
    }


    replaceState(appName: string, state: any) {
        this.appsData[appName].state = state
    }

}