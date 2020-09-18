import { SyncActionOffload } from "../offload";
import { HttpActionMeta } from "../http";
import { WebSocketActionMeta } from "../websockets";
import { PromiseActionMeta } from "../promise";

export type DataAndTypeOps = {
  kind: "DataAndTypeOps";
  data: any;
  processed: boolean;
  optimisticFailed?: any;
  optimisticSuccess?: any;
  typeOp: NonNullable<HttpActionMeta["typeOps"]>;
};

export type ActionInternalMeta =
  | { kind: "Data"; data: any; processed: boolean }
  | { kind: "State"; data: any; processed: boolean }
  | DataAndTypeOps;

export type Action = Readonly<{
  name: any;
  group: string;
  extensions?: Record<string, unknown>;
  _internal?: ActionInternalMeta;
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
  AA extends Action | undefined
> = Readonly<{
  r: Reducer<S, A>;
  g: G;
  ds: S;
  m: RMeta<S, AA>;
}>;

export type OflloadActionResult = {
  abortController?: AbortController;
  loading?: boolean;
  error?: Error;
  completed?: boolean;
};

export type ActionMeta<S> = {
  h?: HttpActionMeta;
  form?: boolean;
  offload?: SyncActionOffload<S>;
  ws?: WebSocketActionMeta;
  p?: PromiseActionMeta;
};

/**
 *  a: all meta information about actions(sync and async)
 */
export type RMeta<S, AA> = Readonly<{
  a: Record<string, ActionMeta<S>>;
  persist?: boolean;
  persistKeys?: string[];
  dpersist?: boolean;
  dpersistKeys?: string[];
  async?: AA;
}>;

export class AbortError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "AbortError";
  }
}
