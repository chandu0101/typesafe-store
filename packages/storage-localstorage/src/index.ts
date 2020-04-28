import { PersistanceStorage, ReducerGroup, PersistanceStorageOptions, GetStateFromReducers } from "@typesafe-store/store"





class PersistantLocalStorage implements PersistanceStorage {
    private PREFIX = "T_STORE_"
    constructor(public readonly options: PersistanceStorageOptions) {
    }

    dataChanged = async (input: Record<string, any>): Promise<void> => {
        Object.entries(input).forEach(([key, value]) => {
            localStorage.setItem(`${this.PREFIX}${key}`, JSON.stringify(value))
        })
    }
    getState = async (stateKeys: string[]): Promise<Record<string, any> | undefined> => {
        const obj = Object.entries(localStorage).reduce((ro, [key, value]) => {
            if (key.startsWith(this.PREFIX)) {
                const sk = key.replace(this.PREFIX, "")
                if (stateKeys.includes(sk)) {
                    ro[sk] = JSON.parse(value)
                } else {
                    localStorage.removeItem(key)
                }
            }
            return ro;
        }, {} as Record<string, any>)
        return obj;
    }
    clear = async (): Promise<void> => {
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(this.PREFIX)) {
                localStorage.removeItem(key)
            }
        })
    }

    getKey = async <T>(key: string): Promise<T | undefined> => {
        let result: T | undefined = undefined
        const v = localStorage.getItem(key)
        if (v !== null) {
            result = v as any
        }
        return result
    }

    setKey = async <T>(key: string, value: T): Promise<void> => {
        localStorage.setItem(key, value as any)
    }


}


export default PersistantLocalStorage