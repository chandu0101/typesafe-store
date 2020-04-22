
import WebSoocket from "ws";
import { TSDevToolsServerConnection } from "./server";
import { MetaUtils } from "./meta-utils";

type DevToolsServerOption = { port?: number }

function main(options?: DevToolsServerOption) {

    const port = options?.port || 8998

    const server = new WebSoocket.Server({ port: port })

    server.on("connection", (ws, req) => {
        console.log("on connecttion ", req);
        const conn = new TSDevToolsServerConnection(ws)
        MetaUtils.addConnection(conn)
    })

    const client1 = new WebSoocket("ws://localhost:8998", { protocol: "client-" })

    const client2 = new WebSoocket("ws:/localhost:8998", { protocol: "app-" })

    client1.onopen = (e) => {
        client1.send("opened connection")
    }
    client1.onmessage = (e) => {
        console.log("######## on message client ", e.data);
    }

    // client1.send("client2 message ")

    // client2.send("client2 message")

}

main()


export default main;