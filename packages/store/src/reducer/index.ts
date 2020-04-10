

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
    p?: Record<string, any>;
    gql?: Record<string, any>;
    grpc?: Record<string, any>;
    async?: AA
}>;