import { Action } from "../reducer";



export type NetWorkOfflineOptions = {
    persist?: {
        serializer: (actions: Action[]) => string,
        deserializer: (str: string) => Action[]
    }
}