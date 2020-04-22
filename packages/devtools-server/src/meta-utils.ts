import { WS, TSDevToolsServerConnection } from "./server";
import { DevToolServerGlobalMeta, Message } from "./types";


export class MetaUtils {

    static getConfig(): DevToolServerGlobalMeta {
        if (global.devToolServerMeta) {
            return global.devToolServerMeta
        } else {
            return { connections: [] }
        }
    }

    static addConnection(con: TSDevToolsServerConnection) {
        this.getConfig().connections.push(con)
    }

    static broadcastMessageToDevTools(m: Message) {
        const connections = this.getConfig().connections
        connections.forEach(con => {
            if (con.type === "DevTools" && con.id && con.ws.OPEN) {
                const newM = { ...m, id: con.id }
                con.ws.send(JSON.stringify(newM))
            }
        })
    }

    static removeConnection(con: TSDevToolsServerConnection) {
        const config = this.getConfig()
        config.connections = config.connections.filter(c => c !== con)
    }

    // static sendMessageToApp()

}