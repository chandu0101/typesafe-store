


export type Offload = void

export type OffloadAsync = {}


export type ActionOffload<S> = {
    stateToWorkerIn: (s: S) => Partial<S>,
    workerResponseToState: (s: S, wr: any) => S,
    propAccessArray: string[]
}