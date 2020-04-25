

import * as  WebSockoket from "ws"
import { DevToolsConnectionInitialteMessage, Message } from "./types"
import { MetaUtils } from "./meta-utils"
import chalk from "chalk"

export type WS = WebSockoket.MessageEvent["target"]


export class TSDevToolsServerConnection {

    type?: "App" | "DevTools"
    id!: string
    appName!: string
    queue: Message[] = []
    constructor(public readonly ws: WS) {
        ws.onopen = this.handleOpen
        ws.onmessage = this.handleMessage
        ws.onerror = this.handleError
        ws.onclose = this.handleClose
    }

    handleOpen = (e: WebSockoket.OpenEvent) => {
        console.log("******  TSDevetools server connection open : ");
    }

    handleMessage = (e: WebSockoket.MessageEvent) => {
        const m = JSON.parse(e.data as string) as Message
        console.log("Server on message : ", m, this.type);
        if (m.kind === "InitiateDevToolsConnection") {
            console.log("InitiateDevToolsConnection");
            this.type = m.type
            console.log("type ", this.type);
        } else if (m.kind === "InitiateAppConnection") {
            this.type = m.type;
            this.appName = m.appName
            if (MetaUtils.isDevtoolsAppStarted()) {
                MetaUtils.broadcastMessageToDevTools(m)
            } else {
                console.info(chalk.yellow(`Looks like you didn't started devtools app, start devtools first`))
            }
        }
        else if (m.kind === "StartMessage") {
            this.id = m.id
        } else if (m.kind === "Action") {
            if (this.type === "App") {
                MetaUtils.broadcastMessageToDevTools(m)
            } else if (this.type === "DevTools") {
                MetaUtils.broadCastMessageToApp(m)
            }
        }
    }

    handleError = (e: WebSockoket.ErrorEvent) => {
        console.log("on error : ", e.message);
    }

    handleClose = (e: WebSockoket.CloseEvent) => {
        console.log("on close event : ", e.reason);
        MetaUtils.removeConnection(this)
    }
}