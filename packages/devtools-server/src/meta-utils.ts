import { WS, TSDevToolsServerConnection } from "./server";
import { DevToolServerGlobalMeta, Message, ActionMessage } from "./types";


export class MetaUtils {

    static getConfig(): DevToolServerGlobalMeta {
        if (!global.devToolServerMeta) {
            global.devToolServerMeta = { connections: [] }
        }
        return global.devToolServerMeta
    }

    static addConnection(con: TSDevToolsServerConnection) {
        this.getConfig().connections.push(con)
    }

    static broadcastMessageToDevTools(m: Message) {
        console.log("broad casting  message : ", m);
        const connections = this.getConfig().connections
        connections.forEach(con => {
            console.log("con", con.ws.OPEN, con.type, con.id);
            if (con.type === "DevTools" && con.id && con.ws.OPEN) {
                const newM = { ...m, id: con.id }
                con.ws.send(JSON.stringify(newM))
            }
        })
    }

    static broadCastMessageToApp(m: ActionMessage) {
        console.log("broadCastMessageToApp : ", m);
        const appName = m.appName
        const connection = this.getConfig().connections.find(c => c.appName === appName)
        if (connection) {
            console.log("got connection for appName : ", connection.type);
            connection.ws.send(JSON.stringify({ name: m.action.name, group: m.action.group, payload: m.stateChanged }), (er) => {
                console.log("Error while sending ", er);
            })
        }
    }

    static isDevtoolsAppStarted() {
        return this.getConfig().connections.some(c => {
            if (c.type === "DevTools") {
                return true
            }
        })
    }

    static removeConnection(con: TSDevToolsServerConnection) {
        const config = this.getConfig()
        config.connections = config.connections.filter(c => c !== con)
    }

    // static sendMessageToApp()

}