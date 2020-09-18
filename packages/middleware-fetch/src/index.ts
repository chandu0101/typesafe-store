import {
  MiddleWare,
  TypeSafeStore,
  Dispatch,
  GetActionFromReducers,
  ReducerGroup,
  Action,
  HttpRequest,
  HttpMethods,
  HttpUrl,
  HttpFieldValue,
  HttpBody,
  HttpActionMeta,
  ActionInternalMeta,
  HttpError,
} from "@typesafe-store/store";

export type FetchGlobalUrlOptions = {
  headers?: Record<string, string>;
  onError?: (resp: Response) => any;
};

export type FetchMiddlewareOptions = {
  urlOptions?: Record<string, () => FetchGlobalUrlOptions>;
};

export class FetchMiddlewareUtils {
  static getUrl(url: HttpUrl): string {
    console.log("******* getting url for : ", url);
    let path = url.path;
    if (url.params) {
      Object.entries(url.params).forEach(([key, value]) => {
        path = path.replace(`{${key}}`, value.toString());
      });
    }
    console.log("queryParams :", url.queryParams, "path: ", path);
    if (url.queryParams) {
      console.log("queryParams :", url.queryParams);
      const query = Object.entries(url.queryParams)
        .filter(([key, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join("&");
      console.log("query : ", query);
      if (query !== "") {
        path = `${path}?${query}`;
      }
    }
    return path;
  }

  static getOptions<
    FV extends HttpMethods,
    U extends HttpUrl,
    B extends HttpBody
  >(
    fRequest: HttpRequest<FV, U, B, any>,
    meta: HttpActionMeta,
    globalOptions?: FetchGlobalUrlOptions
  ) {
    const options: RequestInit = { method: fRequest.type };
    let headers: Record<string, string> = {};
    let contentType = "";
    if (meta.body === "blob") {
      contentType = "application/octet-stream";
    } else if (meta.body === "form") {
      contentType = "multipart/form-data";
    } else if (contentType === "grpc") {
      contentType = "application/grpc-web+proto";
    } else if (meta.body === "urlsearch") {
      contentType = "application/x-www-form-urlencoded;charset=UTF-8";
    } else if (meta.body === "text") {
      contentType = "text/plain;charset=UTF-8";
    } else if (meta.body === "json") {
      contentType = "application/json";
    }
    headers["Content-Type"] = contentType;

    if (globalOptions?.headers) {
      headers = { ...headers, ...globalOptions.headers };
    }
    if (fRequest.headers) {
      headers = { ...headers, ...fRequest.headers };
    }
    if (fRequest.body) {
      if (meta.body === "json") {
        options.body = JSON.stringify(fRequest.body);
      } else {
        options.body = fRequest.body as any;
      }
    }
    options.headers = headers;
    return options;
  }

  static getGlobalUrlOptions(
    url: string,
    mOptions?: FetchMiddlewareOptions
  ): FetchGlobalUrlOptions | undefined {
    let result: FetchGlobalUrlOptions | undefined = undefined;
    if (mOptions && mOptions.urlOptions) {
      Object.entries(mOptions.urlOptions).some(([key, value]) => {
        if (url.startsWith(key)) {
          result = value();
          return true;
        }
      });
    }
    return result;
  }
}

function isFetchAction(rg: ReducerGroup<any, any, any, any>, action: Action) {
  return rg.m.a[action.name] && rg.m.a[action.name].h;
}

type GenericHttpAsyncData = HttpFieldValue<any, any, any, any, any>;

async function processHttpAction<
  R extends Record<string, ReducerGroup<any, any, any, any>>
>(
  store: TypeSafeStore<R>,
  action: GetActionFromReducers<R>,
  rg: ReducerGroup<any, any, any, any>,
  moptions?: FetchMiddlewareOptions
) {
  const fetchRequest: HttpRequest<
    HttpMethods,
    HttpUrl,
    HttpBody,
    any
  > = (action as any).fetch;
  const fetchMeta = rg.m.a[action.name].h!;
  const url = FetchMiddlewareUtils.getUrl(fetchRequest.url);
  const globalUrlOptions = FetchMiddlewareUtils.getGlobalUrlOptions(
    url,
    moptions
  );
  const options = FetchMiddlewareUtils.getOptions(
    fetchRequest,
    fetchMeta,
    globalUrlOptions
  );
  let res: Response = null as any;
  const responseType = fetchMeta.response;
  let abortController: AbortController | undefined = undefined;
  let timeout = false;
  if (fetchRequest.abortable) {
    abortController = new AbortController();
  }
  if(fetchRequest.timeout !== undefined) {
     if(!abortController) {
      abortController = new AbortController();
     }
     setTimeout(() => {
        abortController?.abort();
        timeout = true;
     },fetchRequest.timeout)
  }
  if (fetchRequest.optimisticResponse) {
    // optimistic response
    if (fetchMeta.response === "stream") {
      throw new Error(`Optimistic response not supported in case of stream`);
    }
    const opResponse: GenericHttpAsyncData = {
      data: fetchRequest.optimisticResponse,
      abortController,
      optimistic: true,
    };
    if (fetchMeta.typeOps) {
      const im: ActionInternalMeta = {
        processed: true,
        kind: "DataAndTypeOps",
        data: opResponse,
        typeOp: fetchMeta.typeOps,
      };
      store.dispatch({
        ...action,
        _internal: im,
      });
    } else {
      store.dispatch({
        ...action,
        _internal: { processed: true, kind: "Data", data: opResponse },
      });
    }
  } else {
    const resultLoading: GenericHttpAsyncData = {
      loading: true,
      abortController,
    };
    let ai: ActionInternalMeta = null as any;
    if (fetchMeta.typeOps) {
      ai = {
        processed: true,
        kind: "DataAndTypeOps",
        typeOp: fetchMeta.typeOps,
        data: resultLoading,
      };
    } else {
      ai = { processed: true, kind: "Data", data: resultLoading };
    }
    store.dispatch({ ...action, _internal: ai });
  }

  try {
    if (abortController) {
      options.signal = abortController.signal;
    }
    res = await fetch(url, options);
  } catch (error) {
    if (fetchRequest.offline && error.name !== "AbortError") {
      store.addNetworkOfflineAction(action);
      const resultOffline: GenericHttpAsyncData = {
        offline: true,
        optimistic: !!fetchRequest.optimisticResponse,
        completed: true,
      };
      let ai: ActionInternalMeta = {
        kind: "Data",
        data: resultOffline,
        processed: true,
      };
      //TODO how to handle typeops offline case? ,send error ?
      // if (fetchMeta.typeOps) {
      //     ai = {
      //         processed: true, data: resultError,
      //         optimisticFailed: fetchRequest.optimisticResponse,
      //         kind: "DataAndTypeOps", typeOp: fetchMeta.typeOps,
      //     }
      // } else {
      //     ai = { kind: "Data", data: resultError, processed: true }
      // }
      store.dispatch({ ...action, _internal: ai });
    } else {
      let fError: HttpError<any>;
      if (error.name === "AbortError") {
        if(timeout) {
           fError = {kind:"TimeoutError" ,message:"TimeOut"}
        }
        else {
            fError = { kind: "AbortError" };
        }
      } else {
        fError = { kind: "NetworkError", error };
      } //TODO timeout error
      const resultError: GenericHttpAsyncData = {
        error: fError,
        completed: true,
      };
      let ai: ActionInternalMeta = null as any;
      if (fetchMeta.typeOps) {
        ai = {
          processed: true,
          data: resultError,
          optimisticFailed: fetchRequest.optimisticResponse,
          kind: "DataAndTypeOps",
          typeOp: fetchMeta.typeOps,
        };
      } else {
        ai = { kind: "Data", data: resultError, processed: true };
      }
      store.dispatch({ ...action, _internal: ai });
    }
    return;
  }
  console.log("*************** Resp : ", res.ok, res.status);
  if (!res.ok) {
    if (globalUrlOptions?.onError) {
      globalUrlOptions.onError(res);
    }
    let error = res.statusText;
    if (responseType === "json") {
      error = await res.json();
    } else if (responseType === "text") {
      error = await res.text();
    }
    const resultError: GenericHttpAsyncData = {
      error: { kind: "ResponseError", error },
      completed: true,
    };
    let ai: ActionInternalMeta = null as any;
    if (fetchMeta.typeOps) {
      ai = {
        processed: true,
        data: resultError,
        optimisticFailed: fetchRequest.optimisticResponse,
        kind: "DataAndTypeOps",
        typeOp: fetchMeta.typeOps,
      };
    } else {
      ai = { kind: "Data", data: resultError, processed: true };
    }
    store.dispatch({ ...action, _internal: ai });
  } else {
    const processStream = async <R>(
      reader: ReadableStreamDefaultReader<R>
    ): Promise<any> => {
      const result = await reader.read();
      if (result.done) {
        const resultSuccess: GenericHttpAsyncData = { completed: true };
        let ai: ActionInternalMeta = null as any;
        if (fetchMeta.typeOps) {
          ai = {
            kind: "DataAndTypeOps",
            processed: true,
            data: resultSuccess,
            typeOp: fetchMeta.typeOps,
          };
        } else {
          ai = { kind: "Data", processed: true, data: resultSuccess };
        }
        store.dispatch({ ...action, _internal: ai });
        return;
      } else {
        let v = result.value;
        //
        const rdata = fetchMeta.tf ? fetchMeta.tf(v, fetchRequest) : v;
        const resultSuccess: GenericHttpAsyncData = { data: rdata };
        let ai: ActionInternalMeta = null as any;
        if (fetchMeta.typeOps) {
          ai = {
            kind: "DataAndTypeOps",
            processed: true,
            data: resultSuccess,
            typeOp: fetchMeta.typeOps,
          };
        } else {
          ai = { kind: "Data", processed: true, data: resultSuccess };
        }
        store.dispatch({ ...action, _internal: ai });
        return processStream(reader);
      }
    };

    if (responseType === "stream") {
      processStream(res.body!.getReader());
    } else {
      let response = undefined as any;
      if (responseType === "json") {
        response = await res.json();
      } else if (responseType === "blob") {
        response = await res.blob();
      } else if (responseType === "arrayBuffer") {
        response = await res.arrayBuffer();
      } else if (responseType === "text") {
        response = await res.text();
      }

      if (fetchMeta.graphql) {
        if (fetchMeta.graphql.multiOp) {
          // multi graphql op `query q1 {id} ; query d2 {id2}`
          const resp: any[] = response;
          let allErrors = true;
          let datas: any[] = [];
          const errorsArr: any[] = [];
          resp.forEach((v) => {
            if (v.data) {
              allErrors = false;
              datas.push(v.data);
              errorsArr.push(v.errors || []);
            } else {
              datas.push(null);
              errorsArr.push(v.error.erros);
            }
          });

          const resultSuccess: GenericHttpAsyncData = {
            data: datas,
            error: { kind: "ResponseError", error: errorsArr },
            completed: true,
          };
          const ai: ActionInternalMeta = {
            kind: "Data",
            data: resultSuccess,
            processed: true,
          };
          store.dispatch({ ...action, _internal: ai });
        } else {
          if (response.data) {
            let rdata = response.data;
            let successResult: GenericHttpAsyncData = {
              data: rdata,
              error: response.errors,
              completed: true,
            }; // in graphql for successfull operations also we get errors
            let ai: ActionInternalMeta = null as any;
            if (fetchMeta.typeOps) {
              ai = {
                kind: "DataAndTypeOps",
                processed: true,
                data: successResult,
                typeOp: fetchMeta.typeOps,
                optimisticSuccess: fetchRequest.optimisticResponse,
              };
            } else {
              ai = { kind: "Data", processed: true, data: successResult };
            }
            store.dispatch({ ...action, _internal: ai });
          } else {
            // graphql error eventhough network op success.
            const errorResult: GenericHttpAsyncData = {
              error: response.error.errors,
              completed: true,
            };
            let ai: ActionInternalMeta = null as any;
            if (fetchMeta.typeOps) {
              ai = {
                kind: "DataAndTypeOps",
                processed: true,
                data: errorResult,
                typeOp: fetchMeta.typeOps,
                optimisticFailed: fetchRequest.optimisticResponse,
              };
            } else {
              ai = { kind: "Data", processed: true, data: errorResult };
            }
            store.dispatch({ ...action, _internal: ai });
          }
        }
      } else {
        if (fetchMeta.tf) {
          response = fetchMeta.tf(response, fetchRequest);
        }
        const resultSuccess = { data: response, completed: true };
        let ai: ActionInternalMeta = null as any;
        if (fetchMeta.typeOps) {
          ai = {
            kind: "DataAndTypeOps",
            processed: true,
            data: resultSuccess,
            optimisticSuccess: fetchRequest.optimisticResponse,
            typeOp: fetchMeta.typeOps,
          };
        } else {
          ai = { kind: "Data", processed: true, data: resultSuccess };
        }
        store.dispatch({ ...action, _internal: ai });
      }
    }
  }
}

export default function createFetchMiddleware(
  options?: FetchMiddlewareOptions
): MiddleWare<any> {
  return (store: TypeSafeStore<any>) => (next: Dispatch<Action>) => (
    action: Action
  ) => {
    if (action._internal && action._internal.processed) {
      // if already processed by other middlewares just pass through
      return next(action);
    }
    const rg = store.getReducerGroup(action.group);
    if (isFetchAction(rg, action)) {
      //
      return processHttpAction(store, action, rg, options);
    } else {
      return next(action);
    }
  };
}
