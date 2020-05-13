import { Action } from "../reducer";
import { TypeOpsType } from "../typeops";

export type Json =
    | string
    | number
    | boolean
    | null
    | { [property: string]: Json }
    | Json[];


export class FetchRejectionError {
    constructor(public readonly error: Error) {

    }
}


export type FetchResponse = Record<string, any> | void | ArrayBuffer | Blob | string

export type FetchBody = Record<string, any> | null | BodyInit

// we can not use const because end user may use isolatedModules flag, probably just go with union :s
export enum FetchVariants {
    GET = "GET",
    POST = "POST",
    PATCH = "PATCH",
    DELETE = "DELETE",
    PUT = "PUT"
}


export type FetchFieldValue<D, U extends FUrl, B extends FetchBody, FV extends FetchVariants, E,> = Readonly<{
    loading?: boolean;
    error?: E | FetchRejectionError;
    data?: D;
    abortController?: AbortController
    optimistic?: boolean,
    offline?: boolean,
    completed?: boolean,
    _fmeta?: FetchRequest<FV, U, B, D>
}>;

export type FetchRequest<FV extends FetchVariants, U extends FUrl, B extends FetchBody, D> = { type: FV, url: U, body?: B, offline?: boolean, abortable?: boolean, headers?: Record<string, string>, optimisticResponse?: D }

export type FetchAction = Action & { fetch: FetchRequest<FetchVariants, FUrl, FetchBody, any> }


/**
 *  tf: transform function from fetch response to other shape to store in state 
 */
export type FetchActionMeta = {
    response: "json" | "text" | "blob" | "arrayBuffer" | "void" | "stream",
    body?: "json" | "blob" | "text" | "grpc" | "form" | "urlsearch"
    tf?: (d: any, req?: FetchRequest<any, any, any, any>) => any,
    offload?: boolean,
    graphql?: { multiOp?: boolean },
    completed?: boolean
    typeOps?: {
        name: TypeOpsType,
        propAccess?: string,
    },
    grpc?: { sf: (d: any) => Uint8Array, dsf: (i: Uint8Array) => any }
}

type ReqReq<D, T> = (input: D, req: FetchRequest<any, any, any, T>) => T;

export type FetchTransform<D, T> = (input: D) => T | ReqReq<D, T>

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
    T extends FetchTransform<R, any> | null = null
    > = T extends FetchTransform<R, infer PR> ? FetchFieldValue<PR, U, null, FetchVariants.GET, E> : FetchFieldValue<R, U, null, FetchVariants.GET, E>

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
    T extends FetchTransform<R, any> | null = null
    > = T extends FetchTransform<R, infer PR> ? FetchFieldValue<PR, U, B, FetchVariants.POST, E> : FetchFieldValue<R, U, B, FetchVariants.POST, E>

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
    T extends FetchTransform<R, any> | null = null
    > = T extends FetchTransform<R, infer PR> ? FetchFieldValue<PR, U, B, FetchVariants.PUT, E> : FetchFieldValue<R, U, B, FetchVariants.PUT, E>;

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
    T extends FetchTransform<R, any> | null = null
    > = T extends FetchTransform<R, infer PR> ? FetchFieldValue<PR, U, B, FetchVariants.PATCH, E> : FetchFieldValue<R, U, B, FetchVariants.PATCH, E>;

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
    T extends FetchTransform<R, any> | null = null
    > = T extends FetchTransform<R, infer PR> ? FetchFieldValue<PR, U, B, FetchVariants.DELETE, E> : FetchFieldValue<R, U, B, FetchVariants.DELETE, E>;

