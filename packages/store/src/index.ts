
import { ReducerGroup, Action, RMeta } from "@typesafe-store/reducer"
import compose from "./compose"


type S<T extends Record<string, ReducerGroup<any, any, any, any>>> = {
    [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G, infer AA> ? S : never }

type S2<T extends Record<string, ReducerGroup<any, any, any, any>>> = {
    [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G, infer AA> ? S : never }

type A<T> = { [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G, infer AA> ? AA extends undefined ? A : A & AA : never }[keyof T]


export class TypeSafeStore<R extends Record<string, ReducerGroup<any, any, any, any>>> {

    private reducers: R
    private _state: S<R> = {} as any

    // private meta: Meta = {} as any

    private reducerGroupToStateKeyMap: Record<string, string> = {}

    private listeners: Record<keyof S<R>, Callback[]> = {} as any

    private storage?: PersistanceStorage<S<R>>
    isReady = false
    readonly dipatch: Dispatch<A<R>>

    constructor({ reducers, middleWares, storage }:
        { reducers: R, middleWares: MiddleWare<R>[], storage?: PersistanceStorage<S<R>> }) {
        this.reducers = reducers
        const mchain = middleWares.map(m => m(this))
        this.dipatch = compose<Dispatch<A<R>>>(...mchain)(this.defaultDispatch)
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
    async prepareStoreWithStorage(storage: PersistanceStorage<S<R>>, middleWares: MiddleWare<R>[]) {
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

    private defaultDispatch(a: A<R>) {
        const { group, name } = a;
        const stateKey = this.reducerGroupToStateKeyMap[group]
        const rg = this.reducers[stateKey]
        const ps = this._state[stateKey]
        const s = rg.r(ps, a)
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

    subscribe<K extends keyof S<R>>(groups: (Record<K, (keyof S<R>[K])[]>)[], callback: () => any) {
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


export type Dispatch<A extends Action = Action> = (action: A) => any

// export type Meta = Record<string, RMeta>


export type MiddleWareInfo<S = any> = Readonly<{
    state: () => S,
    meta: Record<string, ReducerGroup<any, any, any, any>>
}>

export type MiddleWare<R extends Record<string, ReducerGroup<any, any, any, any>>> = (store: TypeSafeStore<R>) =>
    (next: Dispatch) => (action: Action) => any

// export interface MiddleWare<S = any> {
//     (info: MiddleWareInfo): (
//         next: any
//     ) => (action: Action) => any
// }

// const g1: ReducerGroup<"", Readonly<{ name: "test", group: "Hello" }>, "Hello", undefined> = { r: <A>(s: "", a: A) => "", g: "Hello", ds: "",aa:undefined }
// const g2: ReducerGroup<4, Readonly<{ name: "test", group: "Hello2" }>, "Hello2", undefined> = { r: <A>(s: 4, a: A) => 4, g: "Hello2", ds: 4, }


const s = { "Hello": "" }

// const ts = new TypeSafeStore({
//     [g1.g]: g1,
//     [g2.g]: g2
// }, [])

// ts.subscribe([{ "Hello": [] }], () => { })
// const s2 = ts.state[g1.g]
// const s3 = ts.state.Hello2


const a1 = { name: "Hello", g: "One" } as const
const a2 = { name: "Hello", g: "Two" }

const a3 = { [a1.g]: a1 }

