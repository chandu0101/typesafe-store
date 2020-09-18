import { Action } from "@typesafe-store/store"
import reducerTypes from "./types"
import devToolsServerTypes from "../apis/websockets/devtools-server/types"



class AppReducer {

    route: reducerTypes.app.Route = "actions"

    wsUrl: string = "ws://localhost:8998"

    appName?: reducerTypes.app.AppName

    appsData: Record<reducerTypes.app.AppName, reducerTypes.app.AppData> = {}

    wsMessage: devToolsServerTypes.operations.GetMessage = {}

    wsSendMessage: devToolsServerTypes.operations.SendMessage = {}

    setAppName(name: string) {
        this.appName = name
    }

    setRoute(route: reducerTypes.app.Route) {
        this.route = route
    }

    setWsUrl(url: string) {
        this.wsUrl = url
        this.appsData = {}
        this.appName = undefined
        this.wsMessage = {}
        this.wsSendMessage = {}
    }

    initializeApp(appName: string) {
        this.appName = appName
        this.appsData[appName] = { actions: [], name: appName, status: "Connected" }
    }

    addAction(appName: string, action: reducerTypes.app.DAction) {
        this.appsData[appName].actions.push(action)
    }

    resetApp(appName: string, actions: reducerTypes.app.DAction[], status: reducerTypes.app.AppConnectionStatus) {
        this.appsData[appName] = { actions, status, name: appName }
    }

}