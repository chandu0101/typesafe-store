import { Action } from "../reducer"


export type TSDontPersist = {}

export type TSPersist = {}

export type PersistanceStorageWriteMode = "REQUIRED" | "OPTIONAL"
export type PersistanceStorageWriteModeFn = (key: string) => PersistanceStorageWriteMode

/**
 *  writeMode :->  REQUIRED : meaning whenever an action dispatched subscribes/listerners will not be notified until data persisted .
 *   OPTIONAL : meaning whenever an action dispatched subscribers will be notified upfront without waiting for confirmation from storage
 */
export type PersistanceStorageOptions = {
    writeMode?: PersistanceStorageWriteMode | PersistanceStorageWriteModeFn,
    persistMode: "epxlicitPersist" | "explicitDontPersist"
    onQuotaExceededError?: (storage: PersistanceStorage, error: any) => Promise<void>
    serializers?: {
        serialize: <V, SV>(key: string, value: V) => SV,
        deserialize: <SV, V>(key: string, value: SV) => V
    }
    preloadloadMerge?: "STORAGE_HIGH_PRI" | "PRELOAD_HIGH_PRI"
}

/**
 * 
 */
export interface PersistanceStorage {
    options: PersistanceStorageOptions
    dataChanged(key: string, value: Record<string, any>): Promise<void>
    getState(stateKeys: string[]): Promise<Record<string, any> | undefined>
    getOfflineActions(): Promise<Action[] | null>;
    setOfflineActions<T>(value: Action[] | null): Promise<void>
    clear(): Promise<void>
    isQuotaExceededError(error: any): boolean
}
