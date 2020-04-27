import { WS, TSDevToolsServerConnection } from "./server"

export const DEVTOOL_MIDDLEWARE_ACTION_GROUP = "DEVTOOL_MIDDLEWARE_SERVER_ACTION_GROUP"
export type Action = { name: string, group: string }

export type DevToolsConnectionInitialteMessage = { kind: "InitiateDevToolsConnection", type: "DevTools", appName?: string }

export type AppInitialConnectedMessage = { kind: "InitiateAppConnection", appName: string, type: "App" }

export type AppConnectDisConnectMessage = { kind: "AppConnectDisConnect", appName: string, mode: "open" | "close" }
export type StartMessage = { kind: "StartMessage", id: string }

export type ActionMessage = { kind: "Action", action: Action, stateChanged: Record<string, any>, id: String, appName: string }
export type AppCloseMessage = { kind: "AppClose", appName: string, }
export type Message = DevToolsConnectionInitialteMessage | ActionMessage | StartMessage
    | AppInitialConnectedMessage | AppConnectDisConnectMessage | AppCloseMessage

export type DevToolServerGlobalMeta = {
    connections: TSDevToolsServerConnection[]
}