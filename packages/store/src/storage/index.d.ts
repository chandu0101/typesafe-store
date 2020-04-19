import { ReducerGroup } from "../reducer";
/**
 *  REQUIRED : meaning whenever an action dispatched subscribes/listerners will not be notified until data persisted
 *   to storage,
 *  OPTIONAL : meaning whenever an action dispatched subscribers will be notified upfront without waiting for confirmation from storage
 */
export declare const enum StorageWriteMode {
    REQUIRED = 0,
    OPTIONAL = 1
}
export declare type PersistanceStorageOptions = {
    writeMode?: StorageWriteMode;
};
/**
 *
 */
export interface PersistanceStorage<R extends Record<string, ReducerGroup<any, any, any, any>>, S> {
    options: PersistanceStorageOptions;
    dataChanged(input: Record<string, string>): Promise<void>;
    getState(reducers: R): Promise<S | undefined>;
    clear(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map