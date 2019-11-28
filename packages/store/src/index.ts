
import { ReducerGroup, Action, RMeta } from "@typesafe-store/reducer"
import compose from "./compose"


type S<T extends Record<string, ReducerGroup<any, any, any>>> = {
    [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G> ? S : never }

type S2<T extends Record<string, ReducerGroup<any, any, any>>> = {
    [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G> ? S : never }

type A<T> = { [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G> ? A : never }[keyof T]

class TypeSafeStore<R extends Record<string, ReducerGroup<any, any, any>>> {

    private reducers: R
    private _state: S<R> = {} as any

    // private meta: Meta = {} as any

    private listeners: Record<keyof S<R>, Callback[]> = {} as any

    private storage?: PersistanceStorage<S<R>>
    isReady = false
    readonly dipatch: Dispatch<A<R>>

    constructor({ reducers, middleWares, storage }:
        { reducers: R, middleWares: MiddleWare[], storage?: PersistanceStorage<S<R>> }) {
        this.reducers = reducers
        const mchain = middleWares.map(m => m({
            state: () => this._state,
            meta: this.reducers
        }))
        this.dipatch = compose<Dispatch<A<R>>>(...mchain)(this.defaultDispatch)
        if (storage) {
            this.prepareStoreWithStorage(storage, middleWares)
        } else {
            for (const r in reducers) {
                this._state[r] = reducers[r].ds
            }
            this.isReady = true
        }
    }

    async prepareStoreWithStorage(storage: PersistanceStorage<S<R>>, middleWares: MiddleWare[]) {
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
        const rg = this.reducers[group]
        const ps = this._state[group]
        const s = rg.r(ps, a)
        if (s !== ps) {
            (this._state as any)[group] = s
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


type Dispatch<A extends Action = Action> = (action: A) => any

export type Meta = Record<string, RMeta>


export type MiddleWareInfo<S = any> = Readonly<{
    state: () => S,
    meta: Record<string, ReducerGroup<any, any, any>>
}>

export type MiddleWare<S = any> = (info: MiddleWareInfo<S>) =>
    (next: Dispatch) => (action: Action) => any

// export interface MiddleWare<S = any> {
//     (info: MiddleWareInfo): (
//         next: any
//     ) => (action: Action) => any
// }

const g1: ReducerGroup<"", Readonly<{ name: "test", group: "Hello" }>, "Hello"> = { r: <A>(s: "", a: A) => "", g: "Hello", ds: "", m: 2 }
const g2: ReducerGroup<4, Readonly<{ name: "test", group: "Hello2" }>, "Hello2"> = { r: <A>(s: 4, a: A) => 4, g: "Hello2", ds: 4, m: 2 }


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