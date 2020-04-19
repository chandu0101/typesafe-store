import { Action } from "../reducer";
import { TypeOpsType } from "../typeops";

export type Json =
    | string
    | number
    | boolean
    | null
    | { [property: string]: Json }
    | Json[];




export type FetchResponse = Record<string, any> | void | ArrayBuffer | Blob | string

export type FetchBody = Record<string, any> | null | BodyInit


export const enum FetchVariants {
    GET = "GET",
    POST = "POST",
    PATCH = "PATCH",
    DELETE = "DELETE",
    PUT = "PUT"
}


export type FetchAsyncData<D, U extends FUrl, B extends FetchBody, FV extends FetchVariants, E,> = Readonly<{
    loading?: boolean;
    error?: E;
    data?: D;
    completed?: boolean,
    _fmeta?: FetchRequest<FV, U, B, D>
}>;

export type FetchRequest<FV extends FetchVariants, U extends FUrl, B extends FetchBody, D> = { type: FV, url: U, body?: B, optimisticResponse?: D }

export type FetchAction = Action & { fetch: FetchRequest<FetchVariants, FUrl, FetchBody, any> }


/**
 *  tf: transform function from fetch response to other shape to store in state 
 */
export type FetchActionMeta = {
    response: "json" | "text" | "blob" | "arrayBuffer" | "void" | "stream",
    body?: "string" // if json body use this flag to JSON.strigify()
    tf?: (d: any) => any,
    offload?: boolean,
    graphql?: { multiOp?: boolean },
    completed?: boolean
    typeops?: {
        name: TypeOpsType,
        obj?: Record<string, string>,
    },
    grpc?: { sf: (d: any) => Uint8Array, dsf: (i: Uint8Array) => any }
}

export type Transform<D, T> = (input: D) => T;

/**
 *  path  static path of API (Example : "books", "updateBooks")
 *  url params (Example : "books/{bookid}/update" , params= {bookid:string} )
 *  queryParams  query params of url (Example : "books?limit=10" = queryParams:{limit:number})
 */
export type FUrl = {
    path: string,
    params?: Record<string, string | number>,
    queryParams?: Record<string, string | number | undefined | string[] | number[]>;
};

/**
 *  U: url string static/dynamic
 *  R: Result of fetch API
 */
export type Fetch<
    U extends FUrl,
    R extends FetchResponse,
    E,
    T extends Transform<R, any> | null = null
    > = T extends Transform<R, infer PR> ? FetchAsyncData<PR, U, null, FetchVariants.GET, E> : FetchAsyncData<R, U, null, FetchVariants.GET, E>

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 */
export type FetchPost<
    U extends FUrl,
    B extends FetchBody,
    R extends FetchResponse,
    E,
    T extends Transform<R, any> | null = null
    > = T extends Transform<R, infer PR> ? FetchAsyncData<PR, U, B, FetchVariants.POST, E> : FetchAsyncData<R, U, B, FetchVariants.POST, E>

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 */
export type FetchPut<
    U extends FUrl,
    B extends FetchBody,
    R extends FetchResponse,
    E,
    T extends Transform<R, any> | null = null
    > = T extends Transform<R, infer PR> ? FetchAsyncData<PR, U, B, FetchVariants.PUT, E> : FetchAsyncData<R, U, B, FetchVariants.PUT, E>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 *  T: Transform function, provide it if you want to transform Result of fetch api into another shape
 */
export type FetchPatch<
    U extends FUrl,
    B extends FetchBody,
    R extends FetchResponse,
    E,
    T extends Transform<R, any> | null = null
    > = T extends Transform<R, infer PR> ? FetchAsyncData<PR, U, B, FetchVariants.PATCH, E> : FetchAsyncData<R, U, B, FetchVariants.PATCH, E>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 */
export type FetchDelete<
    U extends FUrl,
    B extends FetchBody,
    R extends FetchResponse,
    E,
    T extends Transform<R, any> | null = null
    > = T extends Transform<R, infer PR> ? FetchAsyncData<PR, U, B, FetchVariants.DELETE, E> : FetchAsyncData<R, U, B, FetchVariants.DELETE, E>;

