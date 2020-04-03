import { ReducerGroup } from "../reducer";



/**
 *  REQUIRED : meaning whenever an action dispatched subscribes/listerners will not be notified until data persisted 
 *   to storage, 
 *  OPTIONAL : meaning whenever an action dispatched subscribers will be notified upfront without waiting for confirmation from storage
 */
export const enum StorageWriteMode {
    REQUIRED,
    OPTIONAL
}

export type PersistanceStorageOptions = { writeMode?: StorageWriteMode }

/**
 * 
 */
export interface PersistanceStorage<R extends Record<string, ReducerGroup<any, any, any, any>>, S> {
    options: PersistanceStorageOptions
    dataChanged(input: Record<string, string>): Promise<void>
    getState(reducers: R): Promise<S | undefined>
    clear(): Promise<void>
}
