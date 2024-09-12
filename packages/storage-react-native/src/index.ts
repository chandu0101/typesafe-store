import { PersistanceStorage, ReducerGroup, PersistanceStorageOptions, GetStateFromReducers, Action, OFFLINE_ACTIONS_STORAGE_KEY } from "@typesafe-store/store"

import AsyncStorage from '@react-native-community/async-storage';



export default class PeristantReactiveAsyncStorage implements PersistanceStorage {
    private PREFIX = "T_STORE_"
    constructor(public readonly options: PersistanceStorageOptions) {
    }

    //https://github.com/react-native-community/async-storage/blob/master/docs/advanced/IncreaseDbSize.md
    isQuotaExceededError = (error: any): boolean => {
        return error.message != null && error.message.includes("database or disk is full")
    }

    private serialize = (key: string, value: any): string => this.options.serializers ? this.options.serializers.serialize(key, value) : JSON.stringify(value)

    private deserialize = (key: string, sv: any) => this.options.serializers?.deserialize ? this.options.serializers.deserialize(key, sv) : JSON.parse(sv as any)

    dataChanged = async (key: string, value: any): Promise<void> => {
        AsyncStorage.setItem(`${this.PREFIX}${key}`, this.serialize(key, value))
    }
    getState = async (stateKeys: string[]): Promise<Record<string, any> | undefined> => {
        const keys = await AsyncStorage.getAllKeys()
        if (keys.length > 0) {
            const eks: string[] = []
            const dks: string[] = []
            keys.forEach(key => {
                if (key.startsWith(this.PREFIX)) {
                    const sk = key.replace(this.PREFIX, "")
                    if (stateKeys.includes(sk)) {
                        eks.push(key)
                    } else {
                        dks.push(key)
                    }
                }
            })
            await AsyncStorage.multiRemove(dks) // remove non existing keys
            if (eks.length > 0) {
                const values = await AsyncStorage.multiGet(eks)
                const obj = values.reduce((ro, [key, value]) => {
                    const sk = key.replace(this.PREFIX, "")
                    ro[sk] = this.deserialize(sk, value)
                    return ro;
                }, {} as Record<string, any>)
                return obj;
            } else {
                return undefined
            }
        }
        else {
            return undefined
        }
    }

    clear = async (): Promise<void> => {
        const allKeys = await AsyncStorage.getAllKeys()
        const keysToDelete: string[] = []
        allKeys.forEach(key => {
            if (key.startsWith(this.PREFIX)) {
                keysToDelete.push(key)
            }
        })
        AsyncStorage.multiRemove(keysToDelete)
    }

    getOfflineActions = async (): Promise<Action[] | null> => {
        const v = await AsyncStorage.getItem(OFFLINE_ACTIONS_STORAGE_KEY)
        return v === null ? v : this.deserialize(OFFLINE_ACTIONS_STORAGE_KEY, v)
    }
    setOfflineActions = async (value: Action[] | null): Promise<void> => {
        AsyncStorage.setItem(OFFLINE_ACTIONS_STORAGE_KEY, this.serialize(OFFLINE_ACTIONS_STORAGE_KEY, value))
    }

}


