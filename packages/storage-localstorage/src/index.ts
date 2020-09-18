import { PersistanceStorage, ReducerGroup, PersistanceStorageOptions, GetStateFromReducers, Action, OFFLINE_ACTIONS_STORAGE_KEY } from "@typesafe-store/store"





export default class PersistantLocalStorage implements PersistanceStorage {
    private PREFIX = "T_STORE_"
    constructor(public readonly options: PersistanceStorageOptions) {
    }

    private serialize = (key: string, value: any): string => this.options.serializers ? this.options.serializers.serialize(key, value) : JSON.stringify(value)

    private deserialize = (key: string, sv: any) => this.options.serializers?.deserialize ? this.options.serializers.deserialize(key, sv) : JSON.parse(sv as any)

    isQuotaExceededError = (error: any): boolean => {
        return error.name === "QuotaExceededError"
    }

    dataChanged = async (key: string, value: any): Promise<void> => {
        localStorage.setItem(`${this.PREFIX}${key}`, this.serialize(key, value))
    }
    getState = async (stateKeys: string[]): Promise<Record<string, any> | undefined> => {
        const obj = Object.entries(localStorage).reduce((ro, [key, value]) => {
            if (key.startsWith(this.PREFIX)) {
                const sk = key.replace(this.PREFIX, "")
                if (stateKeys.includes(sk)) {
                    ro[sk] = this.deserialize(sk, value)
                } else {
                    localStorage.removeItem(key)
                }
            }
            return ro;
        }, {} as Record<string, any>)
        if (Object.keys(obj).length > 0) {
            return obj;
        } else {
            return undefined
        }
    }

    clear = async (): Promise<void> => {
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(this.PREFIX)) {
                localStorage.removeItem(key)
            }
        })
    }

    getOfflineActions = async (): Promise<Action[] | null> => {
        const v = localStorage.getItem(OFFLINE_ACTIONS_STORAGE_KEY)
        return v === null ? v : this.deserialize(OFFLINE_ACTIONS_STORAGE_KEY, v)
    }
    setOfflineActions = async (value: Action[] | null): Promise<void> => {
        localStorage.setItem(OFFLINE_ACTIONS_STORAGE_KEY, this.serialize(OFFLINE_ACTIONS_STORAGE_KEY, value))
    }

}


