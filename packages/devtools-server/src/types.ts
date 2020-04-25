import { WS, TSDevToolsServerConnection } from "./server"

export type Action = any

export type DevToolsConnectionInitialteMessage = { kind: "InitiateDevToolsConnection", type: "DevTools", appName?: string }

export type AppInitialConnectedMessage = { kind: "InitiateAppConnection", appName: string, type: "App" }

export type StartMessage = { kind: "StartMessage", id: string }

export type ActionMessage = { kind: "Action", action: Action, stateChanged: Record<string, any>, id: String, appName: string }

export type Message = DevToolsConnectionInitialteMessage | ActionMessage | StartMessage
    | AppInitialConnectedMessage

export type DevToolServerGlobalMeta = {
    connections: TSDevToolsServerConnection[]
}