import { DeepReadonly } from "ts-essentials";


//constants 



export type GetActionTypes<T, G extends string> = {
  [K in keyof T]: T[K] extends () => any
  ? { name: K; group: G; payload?: undefined }
  : T[K] extends (s: infer U) => any
  ? Readonly<{ name: K; group: G; payload: U }>
  : never;
}[keyof T];

export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export type Action = Readonly<{
  name: any;
  group: string;
  extensions?: Record<string, unknown>;
  _internal?: { processed?: boolean, data?: any };
}>;

export type Reducer<S extends any, A extends Action> = (
  state: S,
  action: A
) => S;

/**
 *  r : reducer
 *  g : group name reducer belongs to
 *  ds: default state of reducer
 *  m : meta info of reducer
 */
export type ReducerGroup<
  S extends any,
  A extends Action,
  G extends string,
  AA,
  > = Readonly<{
    r: Reducer<S, A>;
    g: G;
    ds: S;
    m: RMeta<AA>;
  }>;

/**
 *  f: fetch meta
 */
export type RMeta<AA> = Readonly<{
  f?: Record<string, any>;
  gql?: Record<string, any>;
  grpc?: Record<string, any>;
  async?: AA
}>;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [property: string]: Json }
  | Json[];


export const enum FetchVariants {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
  PUT = "PUT"
}

// type FetchVariants = "GET" | "POST" | "PATCH" | "DELETE" | "PUT"

export type FetchAsyncData<D, U extends FUrl, B extends (Json | null), FV extends FetchVariants, E> = Readonly<{
  loading?: boolean;
  error?: E;
  data?: D;
  _fmeta?: FetchMeta<FV, U, B>
}>;

export type FetchMeta<FV extends FetchVariants, U extends FUrl, B extends (Json | null)> = { type: FV, url: U, body?: B }

/**
 *
 */
export type FetchRequest<B> = {
  type: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  url: string;
  body?: B;
};

export type Transform<T, D> = (input: T) => D;

/**
 *  path  static path of API (Example : "books", "updateBooks")
 *  url params (Example : "books/{bookid}/update" , params= {bookid:string} )
 *  queryParams  query params of url (Example : "books?limit=10" = queryParams:{limit:number})
 */
export type FUrl = {
  path: string,
  params?: Record<string, string | number>,
  queryParams?: Record<string, string | number>;
};

/**
 *  U: url string static/dynamic
 *  R: Result of fetch API
 */
export type Fetch<
  U extends FUrl,
  R extends Record<string, any>,
  E,
  > = FetchAsyncData<R, U, null, FetchVariants.GET, E>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 */
export type FetchPost<
  U extends FUrl,
  B extends (Json | null),
  R extends Record<string, any>,
  E,
  > = FetchAsyncData<R, U, B, FetchVariants.POST, E>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 */
export type FetchPut<
  U extends FUrl,
  B extends Json,
  R extends Record<string, any>,
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
  B extends Json,
  R extends Record<string, any>,
  E
  > = FetchAsyncData<R, U, B, FetchVariants.PATCH, E>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 */
export type FetchDelete<
  U extends FUrl,
  B extends Json,
  R extends Record<string, any>,
  E
  > = FetchAsyncData<R, U, B, FetchVariants.DELETE, E>;

const sample = (input: { a: number }[]) => {
  return input.length > 0 ? { new: input.length } : { new: 0 };
};

const s: Fetch<
  { path: ""; dynamicPath: ["dude", number]; qParams: {} },
  [], "unknown"
> = {};

const s1: FetchPost<{ path: "" }, { age: number }, [], "string"> = {};

// export declare function getReducer<T, G extends string>(typeName?: string):

export function getReducerGroup<T, G extends string>(
  typeName?: string
): ReducerGroup<
  DeepReadonly<NonFunctionProperties<T>>,
  GetActionTypes<T, G>,
  G,
  any
> {
  throw new Error(
    "Looks like you didn't configured reducer-transformer in your tsconfig"
  );
}
