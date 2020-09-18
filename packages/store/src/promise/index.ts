

export type PromiseRequest<R> = { promiseFn: (signal?: AbortSignal) => Promise<R>, _abortable?: boolean }

export type PromiseActionMeta = {}

export type TSPromiseFieldValue<R, E> = {
    loading?: boolean;
    error?: E
    data?: R,
    abortController?: AbortController
    _ts_pmeta?: PromiseRequest<R>
}

export type TSPromise<R, E> = TSPromiseFieldValue<R, E>