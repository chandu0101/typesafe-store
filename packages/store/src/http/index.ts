import { Action } from "../reducer";
import { TypeOpsType } from "../typeops";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [property: string]: Json }
  | Json[];

// export class FetchRejectionError {
//   constructor(public readonly error: Error) {}
// }

export type HttpResponse =
  | Record<string, any>
  | void
  | ArrayBuffer
  | Blob
  | string;

export type HttpBody = Record<string, any> | null | BodyInit;

// we can not use const because end user may use isolatedModules flag, probably just go with union :s
export enum HttpMethods {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
  PUT = "PUT",
}

export type HttpError<E> =
  | { kind: "TimeoutError"; message: string }
  | { kind: "AbortError" }
  | { kind: "NetworkError"; error: any }
  | { kind: "ResponseError"; error: E };

export type HttpFieldValue<
  D,
  U extends HttpUrl,
  B extends HttpBody,
  FV extends HttpMethods,
  E
> = Readonly<{
  loading?: boolean;
  error?: HttpError<E>;
  data?: D;
  abortController?: AbortController;
  optimistic?: boolean;
  offline?: boolean;
  completed?: boolean;
  _fmeta?: HttpRequest<FV, U, B, D>;
}>;

export type HttpRequest<
  FV extends HttpMethods,
  U extends HttpUrl,
  B extends HttpBody,
  D
> = {
  type: FV;
  url: U;
  body?: B;
  offline?: boolean;
  abortable?: boolean;
  headers?: Record<string, string>;
  timeout?:number,
  optimisticResponse?: D;
};

export type HttpAction = Action & {
  http: HttpRequest<HttpMethods, HttpUrl, HttpBody, any>;
};

/**
 *  tf: transform function from fetch response to other shape to store in state
 */
export type HttpActionMeta = {
  response: "json" | "text" | "blob" | "arrayBuffer" | "void" | "stream";
  body?: "json" | "blob" | "text" | "form" | "urlsearch";
  tf?: (d: any, req?: HttpRequest<any, any, any, any>) => any;
  offload?: boolean;
  graphql?: { multiOp?: boolean };
  completed?: boolean;
  typeOps?: {
    name: TypeOpsType;
    propAccess?: string;
  };
  grpc?: { sf: (d: any) => Uint8Array; dsf: (i: Uint8Array) => any };
};

type ReqReq<D, T> = (input: D, req: HttpRequest<any, any, any, T>) => T;

export type HttpTransform<D, T> = (input: D) => T | ReqReq<D, T>;

/**
 *  path  static path of API (Example : "books", "updateBooks")
 *  url params (Example : "books/{bookid}/update" , params= {bookid:string} )
 *  queryParams  query params of url (Example : "books?limit=10" = queryParams:{limit:number})
 */
export type HttpUrl = {
  path: string;
  params?: Record<string, string | number>;
  queryParams?: Record<
    string,
    string | number | undefined | string[] | number[]
  >;
};

/**
 *  U: url string static/dynamic
 *  R: Result of fetch API
 */
export type HttpGet<
  U extends HttpUrl,
  R extends HttpResponse,
  E,
  T extends HttpTransform<R, any> | null = null
> = T extends HttpTransform<R, infer PR>
  ? HttpFieldValue<PR, U, null, HttpMethods.GET, E>
  : HttpFieldValue<R, U, null, HttpMethods.GET, E>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 */
export type HttpPost<
  U extends HttpUrl,
  B extends HttpBody,
  R extends HttpResponse,
  E,
  T extends HttpTransform<R, any> | null = null
> = T extends HttpTransform<R, infer PR>
  ? HttpFieldValue<PR, U, B, HttpMethods.POST, E>
  : HttpFieldValue<R, U, B, HttpMethods.POST, E>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 */
export type HttpPut<
  U extends HttpUrl,
  B extends HttpBody,
  R extends HttpResponse,
  E,
  T extends HttpTransform<R, any> | null = null
> = T extends HttpTransform<R, infer PR>
  ? HttpFieldValue<PR, U, B, HttpMethods.PUT, E>
  : HttpFieldValue<R, U, B, HttpMethods.PUT, E>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 *  T: Transform function, provide it if you want to transform Result of fetch api into another shape
 */
export type HttpPatch<
  U extends HttpUrl,
  B extends HttpBody,
  R extends HttpResponse,
  E,
  T extends HttpTransform<R, any> | null = null
> = T extends HttpTransform<R, infer PR>
  ? HttpFieldValue<PR, U, B, HttpMethods.PATCH, E>
  : HttpFieldValue<R, U, B, HttpMethods.PATCH, E>;

/**
 *  U: url string static/dynamic
 *  B:  body for fetch request
 *  R:  Result of fetch API
 */
export type HttpDelete<
  U extends HttpUrl,
  B extends HttpBody,
  R extends HttpResponse,
  E,
  T extends HttpTransform<R, any> | null = null
> = T extends HttpTransform<R, infer PR>
  ? HttpFieldValue<PR, U, B, HttpMethods.DELETE, E>
  : HttpFieldValue<R, U, B, HttpMethods.DELETE, E>;
