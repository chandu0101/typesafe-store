

import * as  WebSockoket from "ws"
import { ConnectionInitialteMessage, Message } from "./types"
import { MetaUtils } from "./meta-utils"


export type WS = WebSockoket.MessageEvent["target"]


export class TSDevToolsServerConnection {

    type?: ConnectionInitialteMessage["type"]
    id!: string

    constructor(public readonly ws: WS) {
        ws.onopen = this.handleOpen
        ws.onmessage = this.handleMessage
        ws.onerror = this.handleError
        ws.onclose = this.handleClose
    }

    handleOpen = (e: WebSockoket.OpenEvent) => {
        console.log("******  TSDevetools server connection open : ", e);
    }

    handleMessage = (e: WebSockoket.MessageEvent) => {
        const m = JSON.parse(e.data as string) as Message
        if (m.kind === "InitiateConnection") {
            this.type = m.type
        } else if (m.kind === "StartMessage") {
            this.id = m.id
        } else if (m.kind === "Action") {
            if (this.type === "App") {
                MetaUtils.broadcastMessageToDevTools(m)
            } else if (this.type === "DevTools") {

            }
        }
    }

    handleError = (e: WebSockoket.ErrorEvent) => {
        console.log("on error : ", e);
    }

    handleClose = (e: WebSockoket.CloseEvent) => {
        console.log("on close event : ", e);
        MetaUtils.removeConnection(this)
    }
}