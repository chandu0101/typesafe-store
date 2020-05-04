import { Action } from "../reducer";



export type NetWorkOfflineOptions = {
    persist?: {
        serializer: (actions: Action[]) => string,
        deserializer: (str: string) => Action[]
    },
    statusListener: NetworkStatusListener
}

export interface NetworkStatusListener {
    listen(cb: (status: boolean) => any): () => any
}