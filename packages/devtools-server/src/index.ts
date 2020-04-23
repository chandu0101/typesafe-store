
import WebSoocket from "ws";
import { TSDevToolsServerConnection } from "./server";
import { MetaUtils } from "./meta-utils";

type DevToolsServerOption = { port?: number }

function main(options?: DevToolsServerOption) {

    const port = options?.port || 8998

    const server = new WebSoocket.Server({ port: port })

    server.on("connection", (ws, req) => {
        console.log("on connecttion ");
        const conn = new TSDevToolsServerConnection(ws)
        MetaUtils.addConnection(conn)
    })


    console.log("started devtools server");
    // client1.send("client2 message ")

    // client2.send("client2 message")

}

main()


export default main;