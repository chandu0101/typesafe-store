


export type Offload = void

export type OffloadAsync = {}


export type SyncActionOffload<S> = {
    stateToWorkerIn: (s: S) => Partial<S>,
    workerResponseToState: (s: S, wr: any) => S,
    propAccessArray: string[]
}