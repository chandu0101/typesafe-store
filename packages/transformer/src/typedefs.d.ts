import { GlobalMeta } from "./types";

declare global {
    namespace NodeJS {
        interface Global {
            tStoreMeta: GlobalMeta
        }
    }
}
export default global;