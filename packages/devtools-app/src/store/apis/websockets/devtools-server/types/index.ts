import { TSWebSocket, Action } from "@typesafe-store/store"



namespace devToolsServerTypes {


    export type DevToolsConnectionInitialteMessage = { kind: "InitiateDevToolsConnection", type: "DevTools", appName?: string }

    export type AppInitialConnectedMessage = { kind: "InitiateAppConnection", appName: string, type: "App" }

    export type AppConnectDisConnectMessage = { kind: "AppConnectDisConnect", appName: string, mode: "open" | "close" }

    export type AppCloseMessage = { kind: "AppClose", appName: string, }

    export type StartMessage = { kind: "StartMessage", id: string }

    export type ActionMessage = { kind: "Action", action: Action, stateChanged: Record<string, any>, id: String, appName: string }

    export type Message = DevToolsConnectionInitialteMessage |
        AppInitialConnectedMessage | ActionMessage | StartMessage | AppConnectDisConnectMessage | AppCloseMessage



    export namespace operations {
        export type GetMessage = TSWebSocket<string, string, Message, Error>
        export type SendMessage = TSWebSocket<string, string, Message, Error>
    }



}

export default devToolsServerTypes