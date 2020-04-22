import { TSWebSocketOptions } from "@typesafe-store/middleware-websockets"
import devToolsServerTypes from "./types"


const devToolsServerOptions: TSWebSocketOptions = {
    createMessage: (pm: any, id: string) => {
        return JSON.stringify({ ...pm, id })
    },
    parseMessage: (message: string) => {
        const mp = JSON.parse(message)
        return [mp, mp.id]
    },
    onOpenMessage: () => {
        const m: devToolsServerTypes.ConnectionInitialteMessage = { kind: "InitiateConnection", type: "DevTools" }
        return JSON.stringify(m);
    }
}

export default devToolsServerOptions