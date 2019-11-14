
import { DeepReadonly } from "ts-essentials"

export type GetActionTypes<T, G extends string> = { [K in keyof T]:
    T[K] extends () => any ? { name: K, group: G, payload?: undefined } : T[K] extends (s: infer U) => any ? Readonly<{ name: K, group: G, payload: U }> : never }[keyof T];

export type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;



export type Reducer<S, A> = (state: S, action: A) => S

/**
 *  r : reducer
 *  g : group name reducer belongs to
 *  ds: default state of reducer
 *  m : meta info of reducer
 */
export type ReducerGroup<S, A, G> = Readonly<{
    r: Reducer<S, A>,
    g: G,
    ds: S,
    m: any
}>


// Fetch Actions 

type RemoteData<D> = Readonly<{ loading?: boolean, error?: Error, data?: D }>

type UParam<U extends string, P extends Record<string, string | number> = {}> = null


type Transform<T, D> = (input: T) => D

type Fetch<U extends string | { uri: string, params: Record<string, string | number> }, R extends Record<string, any>,
    T extends Transform<R, any> | null = null> = T extends Transform<R, infer D> ? RemoteData<D> : RemoteData<R>


const s: Fetch<{ uri: "", params: { a: 3 } }, [], (input: []) => { new: 3 }> = {}

s.data?.new


// export declare function getReducer<T, G extends string>(typeName?: string): 


export function getReducerGroup<T, G extends string>(typeName?: string): ReducerGroup<DeepReadonly<NonFunctionProperties<T>>, GetActionTypes<T, G>, G> {
    throw new Error("Looks like you didn't configured reducer-transformer in your tsconfig")
}

