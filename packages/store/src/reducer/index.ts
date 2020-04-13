import { ActionOffload } from "../offload";


export type Action = Readonly<{
    name: any;
    group: string;
    extensions?: Record<string, unknown>;
    _internal?: { processed?: boolean, data?: any };
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


type RFetchActionMeta = { response: "json" | "text" | "blob" | "arrayBuffer" | "void" }


type ActionMeta<S> = {
    f?: RFetchActionMeta, offload?: ActionOffload<S>
}

/**
 *  a: all meta information about actions(sync and async)
 */
export type RMeta<S, AA> = Readonly<{
    a: Record<string, ActionMeta<S>>
    async?: AA
}>;