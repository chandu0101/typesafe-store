import devToolsServerTypes from "../types";



class DevToolServerRequestCreator {



    static createMessageRequest(message: devToolsServerTypes.Message, url: string): devToolsServerTypes.operations.GetMessage["_wsmeta"] {
        return { url: url, message: message as any }
    }

    static createSendMessageRequest(message: devToolsServerTypes.ActionMessage, url: string): devToolsServerTypes.operations.GetMessage["_wsmeta"] {
        return { url: url, message: message as any }
    }
}


export default DevToolServerRequestCreator