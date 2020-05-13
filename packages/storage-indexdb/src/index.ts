import { PersistanceStorage, ReducerGroup, PersistanceStorageOptions, GetStateFromReducers, OFFLINE_ACTIONS_STORAGE_KEY, Action } from "@typesafe-store/store"





class PersitantIndexDBStorage<R extends Record<string, ReducerGroup<any, any, any, any>>> implements PersistanceStorage {
    private readonly _dbp: Promise<IDBDatabase>;
    private readonly dbName = "tstore_storage"
    private readonly storeName = "keyval"

    constructor(public readonly options: PersistanceStorageOptions) {

        this._dbp = new Promise((resolve, reject) => {
            const openreq = indexedDB.open(this.dbName, 1);
            openreq.onerror = () => reject(openreq.error);
            openreq.onsuccess = () => resolve(openreq.result);

            // First time setup: create an empty object store
            openreq.onupgradeneeded = () => {
                openreq.result.createObjectStore(this.storeName);
            };
        });
    }
    private _withIDBStore = (type: IDBTransactionMode, callback: ((store: IDBObjectStore) => void)): Promise<void> => {
        return this._dbp.then(db => new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(this.storeName, type);
            transaction.oncomplete = () => resolve();
            transaction.onabort = transaction.onerror = () => reject(transaction.error);
            callback(transaction.objectStore(this.storeName));
        }));
    }

    private getItem = <Type>(key: IDBValidKey): Promise<Type> => {
        let req: IDBRequest;
        return this._withIDBStore("readonly", store => {
            req = store.get(key);
        }).then(() => req.result);
    }

    private setItem = (key: IDBValidKey, value: any): Promise<void> => {
        return this._withIDBStore("readwrite", store => {
            store.put(value, key);
        });
    }

    private removeItem = (key: IDBValidKey): Promise<void> => {
        return this._withIDBStore("readwrite", store => {
            store.delete(key);
        });
    }

    clear = (): Promise<void> => {
        return this._withIDBStore("readwrite", store => {
            store.clear();
        });
    }

    private keys = (): Promise<IDBValidKey[]> => {
        const keys: IDBValidKey[] = [];

        return this._withIDBStore("readonly", store => {
            // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
            // And openKeyCursor isn't supported by Safari.
            // eslint-disable-next-line
            (store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
                if (!this.result) { return; }
                keys.push(this.result.key);
                this.result.continue();
            };
        }).then(() => keys);
    }

    private serialize = (key: string, value: any) => this.options.serializers ? this.options.serializers.serialize(key, value) : JSON.stringify(value)

    private deserialize = (key: string, sv: any) => this.options.serializers?.deserialize ? this.options.serializers.deserialize(key, sv) : JSON.parse(sv as any)

    dataChanged = async (key: string, value: Record<string, any>): Promise<void> => {
        const v = this.serialize(key, value)
        this.setItem(key, v)
    }

    // getAll, getAllKeys not supported in all browsers
    getState = async (stateKeys: string[]): Promise<Partial<GetStateFromReducers<R>> | undefined> => {
        const keys = await this.keys() as string[]
        if (keys.length > 0) {
            const obj = await keys.reduce(async (roP, key) => {
                let ro: Record<string, any> = await roP
                if (stateKeys.includes(key)) {
                    const sv = await this.getItem(key)
                    ro[key] = this.deserialize(key, sv)
                } else {
                    if (key !== OFFLINE_ACTIONS_STORAGE_KEY) {
                        this.removeItem(key)
                    }
                }
                return ro;
            }, Promise.resolve({} as Record<string, any>))
            return obj as any;
        } else {
            return undefined;
        }


    }

    getOfflineActions = async (): Promise<Action[] | null> => {
        const v = await this.getItem(OFFLINE_ACTIONS_STORAGE_KEY)
        return v === null ? v : this.deserialize(OFFLINE_ACTIONS_STORAGE_KEY, v)
    }
    setOfflineActions = async (value: Action[] | null): Promise<void> => {
        const v = this.serialize(OFFLINE_ACTIONS_STORAGE_KEY, value)
        this.setItem(OFFLINE_ACTIONS_STORAGE_KEY, v)
    }


    isQuotaExceededError = (error: any): boolean => {
        return error.name === "QuotaExceededError"
    }


}


export default PersitantIndexDBStorage