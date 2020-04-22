import { DevToolServerGlobalMeta } from "./types";

declare global {
    namespace NodeJS {
        interface Global {
            devToolServerMeta: DevToolServerGlobalMeta
        }
    }
}
export default global;