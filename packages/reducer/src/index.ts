import { DeepReadonly } from "ts-essentials";

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
  _internal?: { processed?: boolean };
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
  G extends string
> = Readonly<{
  r: Reducer<S, A>;
  g: G;
  ds: S;
  m: RMeta;
}>;

/**
 *  f: fetch meta
 */
export type RMeta = Readonly<{
  f?: any;
  gql?: any;
  grpc?: any;
}>;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [property: string]: Json }
  | Json[];

export type AsyncData<D> = Readonly<{
  loading?: boolean;
  error?: Error;
  data?: D;
}>;

/**
 *
 */
export type FetchRequest<B> = {
  type: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  url: string;
  body?: B;
};

export type Transform<T, D> = (input: T) => D;

export type DynamicURL = {
  uri: string;
  params?: (string | number)[];
  qParams?: Record<string, string | number>;
};

/**
 *  U: url string static/dynamic
 *  R: Result of fetch API
 *  T: Transform function, provide it if you want to transform Result of fetch api into another shape
 */
export type Fetch<
  U extends string | DynamicURL,
  R extends Record<string, any>,
  T extends Transform<R, any> | null = null
> = T extends Transform<R, infer D> ? AsyncData<D> : AsyncData<R>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 *  T: Transform function, provide it if you want to transform Result of fetch api into another shape
 */
export type FetchPost<
  U extends string | DynamicURL,
  B extends Json,
  R extends Record<string, any>,
  T extends Transform<R, any> | null = null
> = T extends Transform<R, infer D> ? AsyncData<D> : AsyncData<R>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 *  T: Transform function, provide it if you want to transform Result of fetch api into another shape
 */
export type FetchPut<
  U extends string | DynamicURL,
  B extends Json,
  R extends Record<string, any>,
  T extends Transform<R, any> | null = null
> = T extends Transform<R, infer D> ? AsyncData<D> : AsyncData<R>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 *  T: Transform function, provide it if you want to transform Result of fetch api into another shape
 */
export type FetchPatch<
  U extends string | DynamicURL,
  B extends Json,
  R extends Record<string, any>,
  T extends Transform<R, any> | null = null
> = T extends Transform<R, infer D> ? AsyncData<D> : AsyncData<R>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 *  T: Transform function, provide it if you want to transform Result of fetch api into another shape
 */
export type FetchDelete<
  U extends string | DynamicURL,
  B extends Json,
  R extends Record<string, any>,
  T extends Transform<R, any> | null = null
> = T extends Transform<R, infer D> ? AsyncData<D> : AsyncData<R>;

const sample = (input: { a: number }[]) => {
  return input.length > 0 ? { new: input.length } : { new: 0 };
};

const s: Fetch<
  { uri: ""; params: ["dude", number]; qParams: {} },
  [],
  typeof sample
> = {};

const s1: FetchPost<"", { age: number }, []> = {};

// export declare function getReducer<T, G extends string>(typeName?: string):

export function getReducerGroup<T, G extends string>(
  typeName?: string
): ReducerGroup<
  DeepReadonly<NonFunctionProperties<T>>,
  GetActionTypes<T, G>,
  G
> {
  throw new Error(
    "Looks like you didn't configured reducer-transformer in your tsconfig"
  );
}
