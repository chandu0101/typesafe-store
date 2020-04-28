import { PersistanceStorage, ReducerGroup, PersistanceStorageOptions, GetStateFromReducers } from "@typesafe-store/store"





class PersitantIndexDBStorage<R extends Record<string, ReducerGroup<any, any, any, any>>> implements PersistanceStorage<R> {
    private PREFIX = "T_STORE_"
    constructor(public readonly options: PersistanceStorageOptions) {
        localStorage.key
    }

    dataChanged = async (input: Record<string, string>): Promise<void> => {
        Object.entries(input).forEach(([key, value]) => {
            localStorage.setItem(`${this.PREFIX}${key}`, value)
        })
    }
    getState = async (stateKeys: string[]): Promise<Partial<GetStateFromReducers<R>> | undefined> => {
        const obj = Object.entries(localStorage).reduce((ro, [key, value]) => {
            if (key.startsWith(this.PREFIX)) {
                const sk = key.replace(this.PREFIX, "")
                if (stateKeys.includes(sk)) {
                    ro[sk] = JSON.parse(value)
                } else {
                    localStorage.removeItem(key) //TODO can we delete item while iterating ?
                }
            }
            return ro;
        }, {} as Record<string, any>)
        return obj as any;

    }
    clear = async (): Promise<void> => {
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith(this.PREFIX)) {
                localStorage.removeItem(key)
            }
        })
    }


}


export default PersitantIndexDBStorage