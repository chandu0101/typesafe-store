import { ReducerGroup, Action, ActionInternalMeta, DataAndTypeOps } from "./reducer"
import { PersistanceStorage, } from "./storage"
import compose from "./compose"
import { Selector, SelectorE, SelectorDepenacyValue } from "./selector"
import { TypeOpEntity } from "./typeops"
import { Navigation, NAVIGATION_REDUCER_GROUP_NAME, Location, NavigationAction } from "./navigation"
import { TStoreUtils } from "./utils"
import { NetWorkOfflineOptions } from "./offline"

/**
 *  store subscription will be called with current procesed action
 */
type Callback = (action: Action) => any

export type Dispatch<A extends Action> = (action: A) => any

export type MiddleWareInfo<S = any> = Readonly<{
    state: () => S,
    meta: Record<string, ReducerGroup<any, any, any, any>>
}>

export type GetStateFromReducers<T extends Record<string, ReducerGroup<any, any, any, any>>> = {
    [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G, infer AA> ? S : any }


export type GetActionFromReducers<T> = { [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G, infer AA> ? AA extends undefined ? A : A | AA : never }[keyof T]

export type MiddleWare<R extends Record<string, ReducerGroup<any, any, any, any>>> = (store: TypeSafeStore<R>) =>
    (next: Dispatch<GetActionFromReducers<R>>) => (action: GetActionFromReducers<R>) => any


/**
 *  resetToDefault: while unsubscribing if you want to reset dependent state keys (keys you used to register) default values 
 *   please note that it will reset to default only when those state keys are not used by others listeners/subscribers
 */
export type UnsubscribeOptions = { resetToDefault?: boolean }

export class TypeSafeStore<R extends Record<string, ReducerGroup<any, any, any, any>>> {

    private reducers: R
    private _state: GetStateFromReducers<R> = {} as any

    private reducerGroupToStateKeyMap: Record<string, string> = {}

    readonly storage?: PersistanceStorage

    private _globalListener?: (action: Action, stateKeys: { name: string, prevValue: any }[]) => any

    private _globalCompleteHandlers: ((action: Action, stateKeys: { name: string, prevValue: any }[]) => any)[] = []

    private typeOpsMata: Record<string, any> = {}

    private _unsubscribeNavigationListener?: () => void

    private _unsubscribeNetworkStatusListener?: () => void

    readonly selectorListeners: Record<keyof GetStateFromReducers<R>, {
        selector: Selector<GetStateFromReducers<R>, any>
        | SelectorE<GetStateFromReducers<R>, any, any>, listener: Callback, tag?: string
    }[]> = {} as any

    private networkOfllineOptions?: NetWorkOfflineOptions & { actions: Action[], storageKey: string }

    /**
     *  use this when you set a persitance storage and to know whether state is loaded from storage or not
     */
    isReady = false

    readonly dispatch: Dispatch<GetActionFromReducers<R>>

    readonly navigation: Navigation

    constructor({ reducers, networkOfflne, middleWares, storage, navigation }:
        {
            reducers: R,
            middleWares: MiddleWare<R>[],
            navigation?: Navigation,
            storage?: PersistanceStorage,
            networkOfflne?: NetWorkOfflineOptions
        }) {
        this.reducers = reducers
        const mchain = middleWares.map(m => m(this))
        this.storage = storage
        this.dispatch = compose<Dispatch<Action>>(...mchain)(this.defaultDispatch)
        if (storage) {
            this.prepareStoreWithStorage(storage)
        } else {
            this.prepareNormalStore()
            this.isReady = true
        }
        if (navigation) {
            this.navigation = navigation
            this.checkNavigationReducerAttached()
            this._unsubscribeNavigationListener = this.navigation.listen(this.handleLocationChange)
        } else { // react-native or similar environments
            this.navigation = "lazyNavigation" as any
        }
        if (networkOfflne) {
            this.setNetWorkOptions(networkOfflne)
        }
    }
    //TODO nativescript/react-native
    private setNetWorkOptions = async (np: NetWorkOfflineOptions) => {
        this.networkOfllineOptions = { ...np, actions: [], storageKey: "TSTORE_NETWORK_OFFLINE_KEY" }
        this._unsubscribeNetworkStatusListener = np.statusListener.listen(this.handleNetworkStatusChange)
        if (this.storage) {
            const ds = await this.storage.getKey(this.networkOfllineOptions!.storageKey)
            if (ds) {
                let actions = []
                if (np.persist) {
                    actions = np.persist.deserializer(ds as any)
                } else {
                    actions = JSON.parse(ds as any)
                }
                this.processNetworkOfflineAction(actions)
            }
        }
    }

    private handleNetworkStatusChange = (status: boolean) => {
        if (status) {
            if (this.networkOfllineOptions?.actions) {
                this.processNetworkOfflineAction(this.networkOfllineOptions!.actions)
            }
        }
    }

    private processNetworkOfflineAction = (actions: Action[]) => {
        if (actions.length > 0) {
            const ac = [...actions]
            this.networkOfllineOptions!.actions = []
            this.storage?.setKey(this.networkOfllineOptions!.storageKey, null)
            ac.forEach(a => {
                this.dispatch(a as any)
            })
        }
    }

    addNetworkOfflineAction = (action: Action) => {
        const nOffOptions = this.networkOfllineOptions
        if (nOffOptions) {
            nOffOptions.actions.push(action)
            if (this.storage) {
                let dataToPersist = null as any
                if (nOffOptions.persist) {
                    dataToPersist = nOffOptions.persist.serializer(nOffOptions.actions)
                } else {
                    dataToPersist = JSON.stringify(nOffOptions.actions)
                }
                this.storage.setKey(nOffOptions.storageKey, dataToPersist)
            }
        } else {
            if (process.env.NODE_ENV !== "production") {
                throw new Error(`You must specify "networkOfflne" config key while creating store`)
            }
        }

    }

    private checkNavigationReducerAttached = () => {
        if (process.env.NODE_ENV !== "production") {
            const nv = this.reducers["navigation"]
            if (!nv || nv.g !== NAVIGATION_REDUCER_GROUP_NAME) {
                throw new Error(`You provided navigation to store but didn't configured reducer
                NavigationReducerGroup in reducers
                 `)
            }
        }
    }

    /**
     *  provide a way to set navigation lazily
     * @param navigation 
     */
    setNavigation = (navigation: Navigation) => {
        if (this._unsubscribeNavigationListener) {
            this._unsubscribeNavigationListener()
        }
        (this as any).navigation = navigation
        this.checkNavigationReducerAttached()
        this._unsubscribeNavigationListener = this.navigation.listen(this.handleLocationChange)
    }

    private handleLocationChange = (loc: Location) => {
        const a: NavigationAction = { name: "setLocation", group: NAVIGATION_REDUCER_GROUP_NAME, payload: loc }
        this.dispatch(a as any)
    }

    /**
     *   
     * @param skipStateSet when preparing store with storage don't override satate,just do other work stateKey to regudcer group mapping
     */
    private prepareNormalStore = (storageData?: Partial<GetStateFromReducers<R>>) => {
        for (const stateKey in this.reducers) {
            const rg = this.reducers[stateKey]
            if (rg) { // suport lazy reducers need more thinking :s 
                const assignedToAnotherStateKey = this.reducerGroupToStateKeyMap[rg.g]
                if (assignedToAnotherStateKey) {
                    throw new Error(`This reducer ${rg.g} already assigned to ${assignedToAnotherStateKey}`)
                }
                this.reducerGroupToStateKeyMap[rg.g] = stateKey
                if (!storageData) {
                    this._state[stateKey] = rg.ds
                } else {
                    const sd = storageData[stateKey]
                    if (sd) {
                        this._state[stateKey] = { ...rg.ds, ...sd }
                    } else {
                        this._state[stateKey] = rg.ds
                    }
                }
            }

        }
    }

    prepareStoreWithStorage = async (storage: PersistanceStorage, ) => {
        try {
            const sState = await storage.getState(Object.keys(this.reducers))
            if (sState) {
                this.prepareNormalStore(sState as any)
            } else { // first time 
                this.prepareNormalStore()
            }
        } finally {
            this.isReady = true
        }
    }

    private defaultDispatch = (a: Action) => {
        console.log("defaultDispatch .... ", a)
        const { group, name, _internal } = a;
        const stateKey = this.reducerGroupToStateKeyMap[group]
        if (!stateKey) {
            throw new Error(`Looks like you defined reducer as lazy reducer but didn't added back,
             please use "store.resetReducer" to add it back.
             `)
        }
        const rg = this.reducers[stateKey]
        const ps = this._state[stateKey]
        let s: typeof ps = ps
        let stateKeysModifiedByTypeOps: string[] = []
        let prevStateOfStateKeysModifiedByTypeOps: Record<string, any> = {}
        if (_internal && _internal.processed) { // processed by middlewares (example: fetch,graphql)
            if (_internal.kind === "Data") {
                s = { ...s, [name]: _internal.data }
            } else if (_internal.kind === "State") {
                s = _internal.data
            } else if (_internal.kind === "DataAndTypeOps") {
                const ai = _internal
                const typeOpName = ai.typeOp.name
                const optimisticFail = ai.optimisticFailed
                const entry = ai.typeOp.obj ? Object.entries(ai.typeOp.obj!)[0] : []
                let typeOpStateKey: string | undefined = undefined
                let typeOpState: any | undefined = undefined
                if (entry.length > 0) {
                    const skGroup = entry[0]
                    if (skGroup !== group) {
                        typeOpStateKey = this.getStateKeyForGroup(skGroup)
                        stateKeysModifiedByTypeOps.push(typeOpStateKey)
                        prevStateOfStateKeysModifiedByTypeOps[typeOpStateKey] = this._state[typeOpStateKey]
                        typeOpState = this._state[typeOpStateKey]
                    } else {
                        typeOpState = s;
                    }
                }
                if (typeOpName === "AppendToList" || typeOpName === "AppendToListAndDiscard") {
                    const discard = typeOpName === "AppendToListAndDiscard"
                    if (optimisticFail) { // revert back state changes
                        const result = this.setPropAccessImmutable(typeOpState, entry[1].split("."), (prev: TypeOpEntity) => {
                            if (!prev) {
                                return prev;
                            } else {
                                const [id, idKey] = this.getIdValueAndIdKey(ai.optimisticFailed)
                                return prev.filter(i => (i as any)[idKey] !== id)
                            }
                        })
                        if (result) {
                            if (typeOpStateKey) {
                                (this._state as any)[typeOpStateKey] = result
                            } else {
                                s = result;
                            }
                        }
                        s = { ...s, [name]: ai.data }
                    } else if (ai.data.data) { // success response 
                        const data = ai.data.data
                        const result = this.setPropAccessImmutable(typeOpState, entry[1].split("."), (prev: TypeOpEntity) => {
                            if (!prev) {
                                return [data]
                            } else {
                                const [id, idKey] = this.getIdValueAndIdKey(ai.optimisticSuccess)
                                if (ai.optimisticSuccess) { // previously appended to list so just replace previous value
                                    return prev.map(i => ((i as any)[idKey] === id) ? { ...i, ...data } : i)
                                }
                                return prev.concat(data)
                            }
                        })
                        if (result) {
                            if (typeOpStateKey) {
                                (this._state as any)[typeOpStateKey] = result
                            }

                        }
                        if (discard) {
                            s = { ...s, [name]: {} } // Note: Currently we only support types ops on Fetch fields so we can assume that value is object
                        } else {
                            s = { ...s, [name]: ai.data }
                        }
                    } else {
                        s = { ...s, [name]: _internal.data }
                    }
                } else if (typeOpName === "PrependToList" || typeOpName === "PrependToListAndDiscard") {
                    const discard = typeOpName === "PrependToListAndDiscard"
                    if (optimisticFail) { // revert back state changes
                        const result = this.setPropAccessImmutable(typeOpState, entry[1].split("."), (prev: TypeOpEntity) => {
                            if (!prev) {
                                return prev;
                            } else {
                                const [id, idKey] = this.getIdValueAndIdKey(ai.optimisticFailed)
                                return prev.filter(i => (i as any)[idKey] !== id)
                            }
                        })
                        if (result) {
                            if (typeOpStateKey) {
                                (this._state as any)[typeOpStateKey] = result
                            } else {
                                s = result
                            }
                        }
                        s = { ...s, [name]: ai.data }
                    } else if (ai.data.data) { // success response 
                        const data = ai.data.data
                        const result = this.setPropAccessImmutable(typeOpState, entry[1].split("."), (prev: TypeOpEntity) => {
                            if (!prev) {
                                return [data]
                            } else {
                                const [id, idKey] = this.getIdValueAndIdKey(ai.optimisticSuccess)
                                if (ai.optimisticSuccess) { // previously appended to list so just replace previous value
                                    return prev.map(i => ((i as any)[idKey] === id) ? { ...i, ...data } : i)
                                }
                                return [data, ...prev]
                            }
                        })
                        if (result) {
                            if (typeOpStateKey) {
                                (this._state as any)[typeOpStateKey] = result
                            } else {
                                s = result
                            }
                        }
                        if (discard) {
                            s = { ...s, [name]: {} } // Note: Currently we only support types ops on Fetch fields so we can assume that value is object
                        } else {
                            s = { ...s, [name]: ai.data }
                        }

                    } else {
                        s = { ...s, [name]: _internal.data }
                    }
                } else if (typeOpName === "UpdateList" || typeOpName === "UpdateListAndDiscard") {
                    const discard = typeOpName === "UpdateListAndDiscard"
                    if (optimisticFail) { // revert back state changes
                        const result = this.setPropAccessImmutable(typeOpState, entry[1].split("."), (prev: TypeOpEntity) => {
                            if (!prev) {
                                return prev;
                            } else {
                                const [id, idKey] = this.getIdValueAndIdKey(ai.optimisticFailed)
                                return prev.filter(i => (i as any)[idKey] !== id)
                            }
                        })
                        if (result) {
                            if (typeOpStateKey) {
                                (this._state as any)[typeOpStateKey] = result
                            } else {
                                s = result
                            }
                        }
                        s = { ...s, [name]: ai.data }
                    } else if (ai.data.data) { // success response 
                        const data = ai.data.data
                        const result = this.setPropAccessImmutable(typeOpState, entry[1].split("."), (prev: TypeOpEntity) => {
                            if (!prev) {
                                return [data]
                            } else {
                                const [id, idKey] = this.getIdValueAndIdKey(data)
                                return prev.map(i => ((i as any)[idKey] === id) ? { ...i, ...data } : i)
                            }
                        })
                        if (result) {
                            if (typeOpStateKey) {
                                (this._state as any)[typeOpStateKey] = result
                            } else {
                                s = result
                            }
                        }
                        if (discard) {
                            s = { ...s, [name]: {} } // Note: Currently we only support types ops on Fetch fields so we can assume that value is object
                        } else {
                            s = { ...s, [name]: ai.data }
                        }

                    } else {
                        s = { ...s, [name]: _internal.data }
                    }
                } else if (typeOpName === "DeleteFromList" || typeOpName === "DeleteFromListAndDiscard") {
                    const discard = typeOpName === "DeleteFromListAndDiscard"
                    if (optimisticFail) { // revert back state changes
                        const result = this.setPropAccessImmutable(typeOpState, entry[1].split("."), (prev: TypeOpEntity) => {
                            if (!prev) {
                                return prev;
                            } else {
                                const [id, idKey] = this.getIdValueAndIdKey(ai.optimisticFailed)
                                const key = `${name}_${group}_${id}`
                                const [index, v] = this.typeOpsMata[key]
                                if (index) {
                                    const na = [...prev]
                                    na.splice(index, 0, v)
                                    this.typeOpsMata[key] = undefined;
                                    return na;
                                } else {
                                    return prev;
                                }

                            }
                        })
                        if (result) {
                            if (typeOpStateKey) {
                                (this._state as any)[typeOpStateKey] = result
                            } else {
                                s = result
                            }
                        }
                        s = { ...s, [name]: ai.data }
                    } else if (ai.data.data) { // success response 
                        const data = ai.data.data
                        const result = this.setPropAccessImmutable(typeOpState, entry[1].split("."), (prev: TypeOpEntity) => {
                            if (!prev) {
                                return prev
                            } else {
                                if (ai.optimisticSuccess) { // already deleted 

                                } else {
                                    const [id, idKey] = this.getIdValueAndIdKey(data)
                                    let index = -1;
                                    let vatIndex: any = null
                                    const na = prev.filter((v, i) => {
                                        if ((v as any)[idKey] === id) {
                                            index = i;
                                            vatIndex = v
                                            return false
                                        } else {
                                            return true;
                                        }
                                    })
                                    if (index > -1) {
                                        const [id, idKey] = this.getIdValueAndIdKey(data)
                                        const key = `${name}_${group}_${id}`
                                        this.typeOpsMata[key] = [index, vatIndex]
                                    }
                                    return na;
                                }

                            }
                        })
                        if (result) {
                            if (typeOpStateKey) {
                                (this._state as any)[typeOpStateKey] = result
                            } else {
                                s = result
                            }
                        }
                        if (discard) {
                            s = { ...ps, [name]: {} } // Note: Currently we only support types ops on Fetch fields so we can assume that value is object
                        } else {
                            s = { ...ps, [name]: ai.data }
                        }

                    } else {
                        s = { ...ps, [name]: ai.data }
                    }
                } else if (typeOpName === "PaginateAppend") {
                    const existingData = ps[name].data
                    console.log("************ PaginateAppend", existingData, ai);
                    let no: any = ai.data
                    const propAccess = entry[1] ? entry[1].split(".") : []
                    if (optimisticFail) { // revert back state changes
                        if (propAccess.length > 0) {
                            const newData = this.setPropAccessImmutable(existingData, propAccess, (prvA: any) => {
                                const ids = this.getPropAccess(ai.optimisticFailed, propAccess).map((d: any) => d.id || d._id) as string[]
                                const na = prvA.filter((o: any) => {
                                    const oid = o.id || o._id;
                                    if (ids.includes(oid)) {
                                        return false
                                    } else {
                                        return true;
                                    }
                                })
                                return na;
                            })

                            no = { ...ai.data, data: newData }

                        } else {
                            const ids = ai.optimisticFailed.map((d: any) => d.id || d._id) as string[]
                            const newA = existingData.filter((o: any) => !ids.includes(o.id || o._id))
                            no = { ...ai.data, data: newA }
                        }
                        s = { ...ps, [name]: ai.data }
                    } else if (ai.data.data) { // success response 
                        const data = ai.data.data
                        console.log("************########********** success case :", propAccess);
                        if (propAccess.length > 0) {
                            const newData = this.setPropAccessImmutable(data, propAccess, (newD: any) => {
                                if (ai.optimisticSuccess) {
                                    const ids = this.getPropAccess(ai.optimisticSuccess, propAccess).map((d: any) => d.id || d._id) as string[]
                                    const exitingList = this.getPropAccess(existingData, propAccess)
                                    const na = exitingList.map((o: any) => {
                                        const oid = o.id || o._id;
                                        if (ids.includes(oid)) {
                                            return { ...o, ...newD.find((o: any) => o.id === oid) }
                                        } else {
                                            return o;
                                        }
                                    })
                                    return na;
                                } else {
                                    let exitingList: any | undefined = undefined
                                    console.log(" in side : existingData: ", existingData);
                                    if (existingData) {
                                        exitingList = this.getPropAccess(existingData, propAccess)
                                        console.log("Entered here ");
                                    }
                                    console.log("******* existing list : ", exitingList, newD);
                                    if (exitingList) {
                                        const result = [...exitingList, ...newD]
                                        console.log("appending new data", result);
                                        return result
                                    } else {
                                        return newD
                                    }
                                }
                            })
                            console.log("************** newData: ", newData);
                            no = { ...ai.data, data: newData }
                        } else {
                            if (ai.optimisticSuccess) {
                                const ids = ai.optimisticSuccess.map((d: any) => d.id || d._id) as string[]
                                const na = existingData.map((o: any) => {
                                    const oid = o.id || o._id;
                                    if (ids.includes(oid)) {
                                        return { ...o, ...data.find((o: any) => o.id === oid) }
                                    } else {
                                        return o;
                                    }
                                })
                                no = { ...ai.data, data: na }

                            } else {
                                if (existingData) {
                                    no = { ...ai.data, data: [...existingData, ...data] }
                                } else {
                                    no = { ...ai.data, data: data }
                                }
                            }
                        }
                        s = { ...ps, [name]: no }
                    } else { // In Pagination scenario if request loading / fails keep the old data but pass error/
                        console.log("Entered loading/error ");
                        s = { ...ps, [name]: { ...ai.data, data: existingData } }
                    }
                } else if (typeOpName === "PaginatePrepend") {
                    const existingData = ps[name].data
                    console.log("************ PaginatePrepend", existingData, ai);
                    let no: any = ai.data
                    const propAccess = entry[1] ? entry[1].split(".") : []
                    if (optimisticFail) { // revert back state changes
                        if (propAccess.length > 0) {
                            const newData = this.setPropAccessImmutable(existingData, propAccess, (prvA: any) => {
                                const ids = this.getPropAccess(ai.optimisticFailed, propAccess).map((d: any) => d.id || d._id) as string[]
                                const na = prvA.filter((o: any) => {
                                    const oid = o.id || o._id;
                                    if (ids.includes(oid)) {
                                        return false
                                    } else {
                                        return true;
                                    }
                                })
                                return na;
                            })

                            no = { ...ai.data, data: newData }

                        } else {
                            const ids = ai.optimisticFailed.map((d: any) => d.id || d._id) as string[]
                            const newA = existingData.filter((o: any) => !ids.includes(o.id || o._id))
                            no = { ...ai.data, data: newA }
                        }
                        s = { ...ps, [name]: ai.data }
                    } else if (ai.data.data) { // success response 
                        console.log("************########********** success case :", propAccess);
                        const data = ai.data.data
                        if (propAccess.length > 0) {
                            const newData = this.setPropAccessImmutable(data, propAccess, (newD: any) => {
                                if (ai.optimisticSuccess) {
                                    const ids = this.getPropAccess(ai.optimisticSuccess, propAccess).map((d: any) => d.id || d._id) as string[]
                                    const exitingList = this.getPropAccess(existingData, propAccess)
                                    const na = exitingList.map((o: any) => {
                                        const oid = o.id || o._id;
                                        if (ids.includes(oid)) {
                                            return { ...o, ...newD.find((o: any) => o.id === oid) }
                                        } else {
                                            return o;
                                        }
                                    })
                                    return na;
                                } else {
                                    let exitingList: any[] = []
                                    if (!existingData) {
                                        exitingList = []
                                    } else {
                                        exitingList = this.getPropAccess(existingData, propAccess)
                                        console.log("entered here ");
                                    }
                                    console.log("******** existing list ", exitingList, newD);
                                    if (exitingList) {
                                        return [...newD, ...exitingList,]
                                    } else {
                                        return newD
                                    }
                                }
                            })
                            no = { ...ai.data, data: newData }
                            console.log("*********############************ success props > 0 ", no);
                        } else {
                            if (ai.optimisticSuccess) {
                                const ids = ai.optimisticSuccess.map((d: any) => d.id || d._id) as string[]
                                const na = existingData.map((o: any) => {
                                    const oid = o.id || o._id;
                                    if (ids.includes(oid)) {
                                        return { ...o, ...data.find((o: any) => o.id === oid) }
                                    } else {
                                        return o;
                                    }
                                })
                                no = { ...ai.data, data: na }

                            } else {
                                if (existingData) {
                                    no = { ...ai.data, data: [...data, ...existingData] }
                                } else {
                                    no = { ...ai.data, data: data }
                                }
                            }
                        }
                        s = { ...s, [name]: no }
                    } else { // In Pagination scenario if request fails keep the old data but pass error
                        console.log("*********############************ loading or error ", existingData);
                        s = { ...s, [name]: { ...ai.data, data: existingData } }
                    }
                }
            }
        }
        else {
            s = rg.r(ps, a)
        }
        (this._state as any)[stateKey] = s
        // notify listeners 
        const changedStateKeys = TStoreUtils.removeDuplicatesInArray([stateKey, ...stateKeysModifiedByTypeOps])
        this.notifyStorageOrListeners({
            stateKeys: changedStateKeys.map(ck => ck === stateKey ? { name: stateKey, prevValue: ps } :
                { name: ck, prevValue: prevStateOfStateKeysModifiedByTypeOps[ck] }),
            action: a, ps: ps
        })
    }

    private setPropAccessImmutable = (obj: any, propAccess: string[], value: (prev: any) => any): any | undefined => {
        let newO = { ...obj }
        propAccess.some((key, i) => {
            if (i === propAccess.length - 1 && i === 0) {
                const newValue = value(obj[key])
                newO = { ...obj, [key]: newValue }
                return true
            }
            else if (i === propAccess.length - 1) {
                const newValue = value(obj[key])
                console.log("*** setPropAccessImmutablenewValue ...........", newValue);
                obj[key] = newValue
            } else {
                const v = newO[key]
                if (!v) {
                    newO = undefined
                    return true
                }
                newO[key] = { ...obj[key] }
                this.setPropAccessImmutable(newO[key], propAccess.slice(1), value)
            }
        })
        return newO
    }


    private getIdValueAndIdKey = (obj: any): [any, string] => {
        let id: any = null as any
        let idKey: string = ""
        if (obj.id) {
            idKey = "id"
            id = obj.id
        } else {
            idKey = "_id"
            id = obj._id
        }
        return [id, idKey]
    }

    private getPropAccess = (obj: any, propAccess: string[]): any | undefined => {
        if (propAccess.length === 1) {
            return obj[propAccess[0]]
        } else {
            const v = obj[propAccess[0]]
            if (v === undefined || v === null) {
                return undefined
            }
            return this.getPropAccess(v, propAccess.slice(1))
        }
    }

    private notifyStorageOrListeners = async ({ stateKeys, action, ps }: { stateKeys: { name: string, prevValue: any }[], action: Action, ps: any }) => {
        if (this.storage && this.storage.options.writeMode === "REQUIRED") {
            await this.notifyStorage(stateKeys, action)
            this.notifyListeners({ stateKeys, action, ps })
        } else {
            this.notifyListeners({ stateKeys, action, ps })
            if (this.storage) {
                this.notifyStorage(stateKeys, action)
            }
        }
    }

    private pickKeys = (obj: any, keys: string[]): any => {
        return keys.reduce((pkr, pk) => {
            pkr[pk] = obj[pk]
            return pkr;
        }, {} as Record<string, any>)
    }

    private excludeKeys = (obj: any, keys: string[]): any => {
        return Object.keys(obj).reduce((pkr, pk) => {
            if (!keys.includes(pk)) {
                pkr[pk] = obj[pk]
            }
            return pkr;
        }, {} as Record<string, any>)
    }


    private notifyStorage = (stateKeys: { name: string, prevValue: any }[], action: Action) => {
        const persistMode = this.storage!.options.persistMode
        const data = stateKeys.reduce((pv, ck) => {
            const rg = this.getReducerGroup(ck.name)
            const eo = this._state[ck.name]
            if (persistMode === "epxlicitPersist") {
                if (rg.m.persist) {
                    pv[ck.name] = this._state[ck.name]
                } else if (rg.m.persistKeys) {
                    const obj = this.pickKeys(eo, rg.m.persistKeys)
                    pv[ck.name] = obj
                }
            } else {
                if (rg.m.dpersist) {
                    // dont persist
                } else if (rg.m.dpersistKeys) {
                    const obj = this.excludeKeys(eo, rg.m.dpersistKeys)
                    pv[ck.name] = obj
                } else {
                    pv[ck.name] = this._state[ck.name]
                }
            }
            return pv;
        }, {} as Record<string, string>)
        return this.storage!.dataChanged(data)
    }


    private notifyListeners = ({ stateKeys, action, ps }: { stateKeys: { name: string, prevValue: any }[], action: Action, ps: any }) => {
        if (this._globalListener) {
            this._globalListener(action, stateKeys)
        } else {
            stateKeys.forEach(stateKey => {
                const slrs = this.selectorListeners[stateKey.name]
                slrs.forEach(slr => {
                    if (this.isSelectorDependenciesChanged(this._state[stateKey.name], stateKey.prevValue, slr.selector, stateKey.name)) {
                        slr.listener(action)
                    }
                })
            })

        }
        console.log("handlers", this._globalCompleteHandlers.length);
        this._globalCompleteHandlers.forEach(c => {
            console.log("calling completion handler ", c);
            c(action, stateKeys)
        })
    }


    get state() {
        return this._state
    }

    getReducerGroup = (group: string) => {
        const stateKey = this.reducerGroupToStateKeyMap[group]
        return this.reducers[stateKey]
    }

    getStateKeyForGroup = (group: string) => {
        return this.reducerGroupToStateKeyMap[group]
    }

    /**
     *  add lazy reducers (useful while code splitting)
     * @param key 
     * @param rg 
     */
    resetReducer = <K extends keyof GetStateFromReducers<R>,>(key: K, rg: R[K]) => {
        this.reducers[key] = rg
        this.reducerGroupToStateKeyMap[rg.g] = key as any
    }

    private isObjectKeysChanged = (pv: any, cv: any, objAccess: string) => {
        console.log("isObjectKeysChanged********* ", pv, cv, objAccess);
        let result = false
        let pvProcessed: any | undefined = pv
        let cvProcessed: any | undefined = cv
        result = objAccess.split(".").some(v => {
            if (pvProcessed && cvProcessed) {
                const lvp = pvProcessed[v]
                const lvc = cvProcessed[v]
                if ((lvp === undefined || lvp === null) && (lvc === undefined || lvc === null)) {
                    return false
                }
                if (lvp !== lvc) {
                    return true
                }
                pvProcessed = lvp
                cvProcessed = lvc
            }
        })
        return result
    }

    isChildObjectsChanged = (currentState: any, prevState: any, oa: Record<string, Record<string, SelectorDepenacyValue>>) => {
        const [keyI, valueI] = Object.entries(oa)[0]
        const cv = this.getPropAccess(currentState, keyI.split("."))
        const pv = this.getPropAccess(prevState, keyI.split("."))
        if (cv === pv) {
            return false
        } else {
            const result = Object.entries(valueI).some(([key, values]) => {
                if (values.length > 0) {
                    const results = values.some(v => {
                        let oachanged = false
                        if (typeof v === "string") {
                            oachanged = this.isObjectKeysChanged(pv, cv, v)
                        } else {
                            oachanged = this.isChildObjectsChanged(cv, pv, v)
                        }
                        if (oachanged) {
                            return true
                        }
                    })
                    return results
                } else {
                    if (cv[key] !== pv[key]) {
                        return true
                    }
                }
            })
            return result
        }
    }

    isSelectorDependenciesChanged = (currentSate: any, prevState: any, selector: Selector<any, any> | SelectorE<any, any, any>, keyChanged: string, ): boolean => {
        console.log("isSelectorDependenciesChanged ", currentSate, prevState, selector.dependencies, keyChanged);
        const deps = selector.dependencies
        let result = false
        if (currentSate === prevState) {
            console.log("same as previous");
            return false
        }
        result = Object.entries(deps).some(([key, value]) => {
            if (keyChanged === key) {
                if (value.length > 0) {
                    const lr = value.some(oa => {
                        const oaChanged = this.isObjectKeysChanged(prevState, currentSate, oa)
                        if (oaChanged) {
                            return true
                        }
                    })
                    if (lr === true) {
                        return lr;
                    }
                } else {
                    if (currentSate !== prevState) {
                        return true
                    }
                }
            }
        })
        return result
    }

    /**
     * 
     * @param selector 
     * @param listener 
     * @param tag component name in which 
     */
    subscribeSelector = <SR>(selector: Selector<GetStateFromReducers<R>, SR> | SelectorE<GetStateFromReducers<R>, any, SR>, listener: Callback, tag?: string) => {

        const keys = Object.keys(selector.dependencies)

        keys.forEach(k => {
            const sls = this.selectorListeners[k]
            const v = { selector, listener, tag }
            if (sls) {
                sls.push(v)
            } else {
                (this.selectorListeners as any)[k] = [v]
            }
        })
        let isSubscribed = true

        return (options?: UnsubscribeOptions) => {
            if (!isSubscribed) {
                return
            }
            keys.forEach(k => {
                const sla = this.selectorListeners[k]
                if (sla) {
                    let index = -1
                    sla.forEach((sl, i) => {
                        if (sl.selector === selector && sl.listener === sl.listener && tag === sl.tag) {
                            index = i
                        }
                    })
                    sla.splice(index, 1)
                }
            })
            if (options && options.resetToDefault) {
                this.resetSelectorDepsToDefaultSate(selector)
            }

            isSubscribed = false
        }
    }

    private resetObjectAccess = (stateKey: string, objAccess: string) => {
        const currentState = this._state[stateKey]
        const defaultSatate = this.reducers[stateKey].ds
        let v: any = defaultSatate
        const oaa = objAccess.split(".").slice(1)
        const exv: string[] = []
        oaa.some(oa => {
            if (v[oa]) {
                v = v[oa]
                exv.push(oa)
            } else {
                return true;
            }
        })
        this.setPropAccessImmutable(currentState, exv, (prv: any) => v)
    }

    /** 
     *  
     */
    resetSelectorDepsToDefaultSate = (selector: Selector<GetStateFromReducers<R>, any> | SelectorE<GetStateFromReducers<R>, any, any>) => {
        Object.entries(selector.dependencies).forEach(([key, values]) => {
            const stateKey = key as any
            const sls = this.selectorListeners[stateKey]
            if (sls && sls.length > 0) {
                let existingStateObjectAccesses: string[] = []
                sls.forEach(sl => {
                    existingStateObjectAccesses.push(...sl.selector.dependencies[stateKey])
                })
                existingStateObjectAccesses = TStoreUtils.removeDuplicatesInArray(existingStateObjectAccesses)
                values.forEach(v => {
                    const exist = existingStateObjectAccesses.filter(ea => ea.includes(v) || v.includes(ea)).length > 0
                    if (!exist) { //  
                        this.resetObjectAccess(stateKey, v)
                    }
                })
            } else { // no listeners for this key
                (this._state as any)[stateKey] = this.reducers[stateKey].ds
            }

        })
    }

    /**
     *  used for framework integrationions
     * @param callback 
     */
    _subscribeGlobal = (callback: (action: Action, stateKeys: { name: string, prevValue: any }[]) => any) => {
        this._globalListener = callback
        return () => {
            this._globalListener = undefined
        }
    }

    _addCompleteHook = (callback: (action: Action, stateKeys: { name: string, prevValue: any }[]) => any) => {
        this._globalCompleteHandlers.push(callback)
        return () => {
            this._globalCompleteHandlers = this._globalCompleteHandlers.filter(h => h !== callback)
        }
    }

}


// type X = NonNullable<undefined | string>
// type A1 = undefined
// type A1Sync = { name: "a3", group: "g1", ws: string }
// type A2 = { name: "a2", group: "g2" }
// type G1S = { books: { name: string }[] }
// const g1: ReducerGroup<G1S, A2, "g1", A1Sync> = { r: null as any, g: "g1", ds: null as any, m: { a: {} } }
// const g2: ReducerGroup<G1S, A2, "g2", undefined> = { r: null as any, g: "g2", ds: null as any, m: { a: {} } }
// const sr = { g1, g2 }
// const store = new TypeSafeStore({ reducers: sr, middleWares: [] })
// type S = typeof store.state
// type AT = GetActionFromReducers2<typeof sr>
// store.dispatch({name:})
// store.subscribe(["g1",], null as any)

