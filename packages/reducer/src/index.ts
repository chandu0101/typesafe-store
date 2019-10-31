


export type GetActionTypes<T, G extends string> = { [K in keyof T]:
    T[K] extends () => any ? { name: K, group: G, payload?: undefined } : T[K] extends (s: infer U) => any ? { name: K, group: G, payload: U } : never }[keyof T];

export type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type AsyncAction<R> = {
    onStart?: () => void, onError: (error: Error) => void,
    onComplete: (result: R) => void
}

