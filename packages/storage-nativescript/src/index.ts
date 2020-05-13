import { PersistanceStorage, ReducerGroup, PersistanceStorageOptions, Action, OFFLINE_ACTIONS_STORAGE_KEY } from "@typesafe-store/store"

import {
    getString,
    setString,
    remove,
    getAllKeys
} from "tns-core-modules/application-settings";



export default class PersistantNativeScriptAppSettingsStorage implements PersistanceStorage {
    private PREFIX = "T_STORE_"
    constructor(public readonly options: PersistanceStorageOptions) {
    }

    private serialize = (key: string, value: any): string => this.options.serializers ? this.options.serializers.serialize(key, value) : JSON.stringify(value)

    private deserialize = (key: string, sv: any) => this.options.serializers ? this.options.serializers.deserialize(key, sv) : JSON.parse(sv as any)

    //TODO  https://app.slack.com/client/T0L97VCSY/C0L9EEURY
    isQuotaExceededError = (error: any): boolean => {
        return error.name === "QuotaExceededError"
    }

    dataChanged = async (key: string, value: any): Promise<void> => {
        setString(`${this.PREFIX}${key}`, this.serialize(key, value))
    }

    getState = async (stateKeys: string[]): Promise<Record<string, any> | undefined> => {
        const obj = getAllKeys().reduce((ro, key) => {
            if (key.startsWith(this.PREFIX)) {
                const sk = key.replace(this.PREFIX, "")
                if (stateKeys.includes(sk)) {
                    const value = getString(key)
                    ro[sk] = this.deserialize(sk, value)
                } else {
                    remove(key)
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
        getAllKeys().forEach((key) => {
            if (key.startsWith(this.PREFIX)) {
                remove(key)
            }
        })
    }

    getOfflineActions = async (): Promise<Action[] | null> => {
        const v = getString(OFFLINE_ACTIONS_STORAGE_KEY)
        return v === null ? v : this.deserialize(OFFLINE_ACTIONS_STORAGE_KEY, v)
    }
    setOfflineActions = async (value: Action[] | null): Promise<void> => {
        setString(OFFLINE_ACTIONS_STORAGE_KEY, this.serialize(OFFLINE_ACTIONS_STORAGE_KEY, value))
    }

}


