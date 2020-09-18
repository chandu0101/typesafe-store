
import githubRestApiTypes from "../../apis/rest/github/types"
import { SyncActionOffloadStatus, FetchFieldValue } from "@typesafe-store/store"

namespace selectorTypes {

    export namespace sync {
        export type FactorialOffload = { factorial: number } & SyncActionOffloadStatus
    }

    export namespace rest {
        // export type Posts = FetchFieldValue<>
    }
}


export default selectorTypes