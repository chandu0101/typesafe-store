
import githubRestApiTypes from "../../apis/rest/github/types"
import { SyncActionOffloadStatus } from "@typesafe-store/store"

namespace selectorTypes {

    export namespace sync {
        export type FactorialOffload = { factorial: number } & SyncActionOffloadStatus
    }
}


export default selectorTypes