export type Json =
    | string
    | number
    | boolean
    | null
    | { [property: string]: Json }
    | Json[];


export type FetchResponse = Record<string, any> | void | ArrayBuffer | Blob | string

export type FetchBody = Json | null


export const enum FetchVariants {
    GET = "GET",
    POST = "POST",
    PATCH = "PATCH",
    DELETE = "DELETE",
    PUT = "PUT"
}


export type FetchAsyncData<D, U extends FUrl, B extends FetchBody, FV extends FetchVariants, E> = Readonly<{
    loading?: boolean;
    error?: E;
    data?: D;
    _fmeta?: FetchRequest<FV, U, B>
}>;

type FetchRequest<FV extends FetchVariants, U extends FUrl, B extends (Json | null)> = { type: FV, url: U, body?: B }


export type Transform<T, D> = (input: T) => D;

/**
 *  path  static path of API (Example : "books", "updateBooks")
 *  url params (Example : "books/{bookid}/update" , params= {bookid:string} )
 *  queryParams  query params of url (Example : "books?limit=10" = queryParams:{limit:number})
 */
export type FUrl = {
    path: string,
    params?: Record<string, string | number>,
    queryParams?: Record<string, string | number | undefined>;
};

/**
 *  U: url string static/dynamic
 *  R: Result of fetch API
 */
export type Fetch<
    U extends FUrl,
    R extends FetchResponse,
    E,
    > = FetchAsyncData<R, U, null, FetchVariants.GET, E>;

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
    > = FetchAsyncData<R, U, B, FetchVariants.POST, E>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 */
export type FetchPut<
    U extends FUrl,
    B extends FetchBody,
    R extends FetchResponse,
    E
    > = FetchAsyncData<R, U, B, FetchVariants.PUT, E>;

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
    E
    > = FetchAsyncData<R, U, B, FetchVariants.PATCH, E>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 */
export type FetchDelete<
    U extends FUrl,
    B extends FetchBody,
    R extends FetchResponse,
    E
    > = FetchAsyncData<R, U, B, FetchVariants.DELETE, E>;