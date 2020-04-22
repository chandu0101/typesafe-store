import devToolsServerTypes from "../types";



class DevToolServerRequestCreator {

    static url: "ws://localhost:8998" = "ws://localhost:8998"

    static createMessageRequest(message: devToolsServerTypes.Message): devToolsServerTypes.operations.GetMessage["_wsmeta"] {
        return { url: this.url, message: message as any }
    }
}


export default DevToolServerRequestCreator