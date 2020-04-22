import { SyncActionOffload } from "../offload";
import { FetchActionMeta } from "../fetch";
import { WebSocketActionMeta } from "../websockets";

export type DataAndTypeOps = {
    kind: "DataAndTypeOps", data: any, processed: boolean, optimisticFailed?: any,
    optimisticSuccess?: any,
    typeOp: NonNullable<FetchActionMeta["typeops"]>
}

export type ActionInternalMeta = { kind: "Data", data: any, processed: boolean }
    | { kind: "State", data: any, processed: boolean }
    | DataAndTypeOps

export type Action = Readonly<{
    name: any;
    group: string;
    extensions?: Record<string, unknown>;
    _internal?: ActionInternalMeta;
}>;


export type PromiseData<D, E = Error> = {
    loading?: boolean;
    error?: E;
    data?: D;
}

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
    AA extends Action | undefined,
    > = Readonly<{
        r: Reducer<S, A>;
        g: G;
        ds: S;
        m: RMeta<S, AA>;
    }>;




export type ActionMeta<S> = {
    f?: FetchActionMeta,
    offload?: SyncActionOffload<S>,
    ws?: WebSocketActionMeta
}

/**
 *  a: all meta information about actions(sync and async)
 */
export type RMeta<S, AA> = Readonly<{
    a: Record<string, ActionMeta<S>>
    async?: AA
}>;