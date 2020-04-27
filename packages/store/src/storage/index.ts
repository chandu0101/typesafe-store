import { ReducerGroup } from "../reducer";
import { GetStateFromReducers } from "../store";





export type TSDontPersist = {}

export type TSPersist = {}

/**
 *  writeMode :->  REQUIRED : meaning whenever an action dispatched subscribes/listerners will not be notified until data persisted .
 *   OPTIONAL : meaning whenever an action dispatched subscribers will be notified upfront without waiting for confirmation from storage
 */
export type PersistanceStorageOptions = {
    writeMode?: "REQUIRED" | "OPTIONAL",
    persistMode: "epxlicitPersist" | "explicitDontPersist"
}

/**
 * 
 */
export interface PersistanceStorage<R extends Record<string, ReducerGroup<any, any, any, any>>> {
    options: PersistanceStorageOptions
    dataChanged(input: Record<string, string>): Promise<void>
    getState(stateKeys: string[]): Promise<Partial<GetStateFromReducers<R>> | undefined>
    clear(): Promise<void>
}
