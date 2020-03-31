
import compose from "./compose"
import { ReducerGroup, Action } from "./reducer"

export * from "./fetch"

export * from "./reducer"

export * from "./graphql"

export type GetStateFromReducers<T extends Record<string, ReducerGroup<any, any, any, any>>> = {
    [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G, infer AA> ? S : any }


export type GetActionFromReducers<T> = { [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G, infer AA> ? AA extends undefined ? A : A & AA : never }[keyof T]

export class TypeSafeStore<R extends Record<string, ReducerGroup<any, any, any, any>>> {

    private reducers: R
    private _state: GetStateFromReducers<R> = {} as any

    // private meta: Meta = {} as any

    private reducerGroupToStateKeyMap: Record<string, string> = {}

    private listeners: Record<keyof GetStateFromReducers<R>, Callback[]> = {} as any

    private storage?: PersistanceStorage<GetStateFromReducers<R>>
    isReady = false
    readonly dipatch: Dispatch<GetActionFromReducers<R>>

    constructor({ reducers, middleWares, storage }:
        { reducers: R, middleWares: MiddleWare<R>[], storage?: PersistanceStorage<GetStateFromReducers<R>> }) {
        this.reducers = reducers
        const mchain = middleWares.map(m => m(this))
        this.dipatch = compose<Dispatch<Action>>(...mchain)(this.defaultDispatch)
        if (storage) {
            this.prepareStoreWithStorage(storage, middleWares)
        } else {
            for (const stateKey in reducers) {
                const rg = reducers[stateKey]
                const assignedToAnotherStateKey = this.reducerGroupToStateKeyMap[rg.g]
                if (assignedToAnotherStateKey) {
                    throw new Error(`This reducer ${rg.g} already assigned to ${assignedToAnotherStateKey}`)
                }
                this.reducerGroupToStateKeyMap[rg.g] = stateKey
                this._state[stateKey] = rg.ds
            }
            this.isReady = true
        }
    }

    //TODO statekey map
    async prepareStoreWithStorage(storage: PersistanceStorage<GetStateFromReducers<R>>, middleWares: MiddleWare<R>[]) {
        this.storage = storage
        const sState = await storage.getState()
        if (sState) {
            this._state = sState
        } else {
            for (const r in this.reducers) {
                this._state[r] = this.reducers[r].ds
            }
        }
        this.isReady = true
    }

    private defaultDispatch(a: Action) {

        const { group, name, _internal } = a;
        const stateKey = this.reducerGroupToStateKeyMap[group]
        const rg = this.reducers[stateKey]
        const ps = this._state[stateKey]
        let s: typeof ps = null as any
        if (_internal && _internal.processed && _internal.data) { // processed by middlewares (example: fetch,graphql)
            s = { ...ps, [name]: _internal.data }
        } else {
            s = rg.r(ps, a)
        }
        if (s !== ps) {
            (this._state as any)[stateKey] = s
            // notify listeners 
            if (this.storage) {
                this.notifyPerssitor(a)
            }
        }
    }

    private notifyPerssitor(action: Action) {
        this.storage?.dataChanged({ [action.group]: "" })
    }

    get state() {
        return this._state
    }

    getReducerGroup(group: string) {
        const stateKey = this.reducerGroupToStateKeyMap[group]
        return this.reducers[stateKey]
    }

    subscribe<K extends keyof GetStateFromReducers<R>>(groups: (Record<K, (keyof GetStateFromReducers<R>[K])[]>)[], callback: () => any) {
        // groups.forEach(g => {
        //     const el = this.listeners[g]
        //     if (el) {
        //         el.push(callback)
        //     } else {
        //         this.listeners[g] = [callback]
        //     }
        // })
    }

}


export interface PersistanceStorage<S> {

    dataChanged(input: Record<string, string>): Promise<void>
    getState(): Promise<S | undefined>
    clear(): Promise<void>
}




// class 

type Callback = () => any

export type Dispatch<A extends Action> = (action: A) => any

export type MiddleWareInfo<S = any> = Readonly<{
    state: () => S,
    meta: Record<string, ReducerGroup<any, any, any, any>>
}>

export type MiddleWare<R extends Record<string, ReducerGroup<any, any, any, any>>> = (store: TypeSafeStore<R>) =>
    (next: Dispatch<GetActionFromReducers<R>>) => (action: GetActionFromReducers<R>) => any





