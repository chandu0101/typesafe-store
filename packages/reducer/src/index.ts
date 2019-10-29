


export type GetActionTypes<T, G extends string> = { [K in keyof T]:
    [T[K]] extends () => AsyncAction<infer R> ? { name: K, async?: true, group?: G, promise: Promise<R> } :
    T[K] extends (s: infer U) => AsyncAction<infer R> ? { name: K, group?: G, async?: true, promise: Promise<R>, payload: U } :
    T[K] extends () => any ? { name: K, group?: G } : T[K] extends (s: infer U) => any ? { name: K, group?: G, payload: U } : never }[keyof T];

export type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type AsyncAction<R> = {
    onStart?: () => void, onError: (error: Error) => void,
    onComplete: (result: R) => void
}

