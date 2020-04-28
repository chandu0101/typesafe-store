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
export interface PersistanceStorage {
    options: PersistanceStorageOptions
    dataChanged(input: Record<string, any>): Promise<void>
    getState(stateKeys: string[]): Promise<Record<string, any> | undefined>
    getKey<T>(key: string): Promise<T | undefined>;
    setKey<T>(key: string, value: T): Promise<void>
    clear(): Promise<void>
}
