import { ReducerGroup, Action, ActionInternalMeta, DataAndTypeOps } from "./reducer"
import { PersistanceStorage, StorageWriteMode } from "./storage"
import compose from "./compose"
import { Selector } from "./selector"
import { TypeOpEntity } from "./typeops"
import { Navigation, NAVIGATION_REDUCER_GROUP_NAME, Location, NavigationAction } from "./navigation"
import { TStoreUtils } from "./utils"

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


export type GetActionFromReducers<T> = { [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G, infer AA> ? AA extends undefined ? A : A & AA : never }[keyof T]

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

    readonly storage?: PersistanceStorage<R, GetStateFromReducers<R>>

    private _globalListener?: Callback

    private typeOpsMata: Record<string, any> = {}

    _unsubscribeNavigationListener?: () => void

    readonly selectorListeners: Record<keyof GetStateFromReducers<R>, { selector: Selector<GetStateFromReducers<R>, any, any>, listener: Callback, tag?: string }[]> = {} as any

    /**
     *  used for framework integrations
     */
    _globalListenerData?: { prevState: any, stateKeys: string[] }

    /**
     *  use this when you set a persitance storage and to know whether state is loaded from storage or not
     */
    isReady = false

    readonly dispatch: Dispatch<GetActionFromReducers<R>>

    readonly navigation: Navigation

    constructor({ reducers, middleWares, storage, navigation }:
        {
            reducers: R,
            middleWares: MiddleWare<R>[],
            navigation?: Navigation,
            storage?: PersistanceStorage<R, GetStateFromReducers<R>>
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
    }


    private checkNavigationReducerAttached() {
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

    private handleLocationChange(loc: Location) {
        const a: NavigationAction = { name: "setLocation", group: NAVIGATION_REDUCER_GROUP_NAME, payload: loc }
        this.dispatch(a as any)
    }

    /**
     *   
     * @param skipStateSet when preparing store with storage don't override satate,just do other work stateKey to regudcer group mapping
     */
    private prepareNormalStore(skipStateSet?: boolean) {
        for (const stateKey in this.reducers) {
            const rg = this.reducers[stateKey]
            if (rg) { // suport lazy reducers need more thinking :s 
                const assignedToAnotherStateKey = this.reducerGroupToStateKeyMap[rg.g]
                if (assignedToAnotherStateKey) {
                    throw new Error(`This reducer ${rg.g} already assigned to ${assignedToAnotherStateKey}`)
                }
                this.reducerGroupToStateKeyMap[rg.g] = stateKey
                if (!skipStateSet) {
                    this._state[stateKey] = rg.ds
                }
            }

        }
    }

    async prepareStoreWithStorage(storage: PersistanceStorage<R, GetStateFromReducers<R>>, ) {
        try {
            const sState = await storage.getState(this.reducers)
            if (sState) {
                this._state = sState
                this.prepareNormalStore(true)
            } else { // first time 
                this.prepareNormalStore()
            }
        } finally {
            this.isReady = true
        }
    }

    private defaultDispatch(a: Action) {

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
        if (_internal && _internal.processed) { // processed by middlewares (example: fetch,graphql)
            if (_internal.kind === "Data") {
                s = { ...ps, [name]: _internal.data }
            } else if (_internal.kind === "State") {
                s = _internal.data
            } else if (_internal.kind === "DataAndTypeOps") {
                const ai = _internal
                const typeOpName = ai.typeOp.name
                const optimisticFail = ai.optimisticFailed
                const entry = ai.typeOp.obj ? Object.entries(ai.typeOp.obj!)[0] : []
                if (entry.length > 0) {
                    const sk = this.getStateKeyForGroup(entry[0])
                    stateKeysModifiedByTypeOps.push(sk)
                }
                const typeOpStateKey = this.getStateKeyForGroup(entry[0])
                const typeOpState = this._state[typeOpStateKey]
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
                            (this._state as any)[typeOpStateKey] = result
                        }
                        s = { ...ps, [name]: ai.data }
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
                            (this._state as any)[typeOpStateKey] = result
                        }
                        if (discard) {
                            s = { ...ps, [name]: {} } // Note: Currently we only support types ops on Fetch fields so we can assume that value is object
                        } else {
                            s = { ...ps, [name]: ai.data }
                        }
                    } else {
                        s = { ...ps, [name]: _internal.data }
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
                            (this._state as any)[typeOpStateKey] = result
                        }
                        s = { ...ps, [name]: ai.data }
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
                            (this._state as any)[typeOpStateKey] = result
                        }
                        if (discard) {
                            s = { ...ps, [name]: {} } // Note: Currently we only support types ops on Fetch fields so we can assume that value is object
                        } else {
                            s = { ...ps, [name]: ai.data }
                        }

                    } else {
                        s = { ...ps, [name]: _internal.data }
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
                            (this._state as any)[typeOpStateKey] = result
                        }
                        s = { ...ps, [name]: ai.data }
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
                            (this._state as any)[typeOpStateKey] = result
                        }
                        if (discard) {
                            s = { ...ps, [name]: {} } // Note: Currently we only support types ops on Fetch fields so we can assume that value is object
                        } else {
                            s = { ...ps, [name]: ai.data }
                        }

                    } else {
                        s = { ...ps, [name]: _internal.data }
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
                            (this._state as any)[typeOpStateKey] = result
                        }
                        s = { ...ps, [name]: ai.data }
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
                            (this._state as any)[typeOpStateKey] = result
                        }
                        if (discard) {
                            s = { ...ps, [name]: {} } // Note: Currently we only support types ops on Fetch fields so we can assume that value is object
                        } else {
                            s = { ...ps, [name]: ai.data }
                        }

                    } else {
                        s = { ...ps, [name]: _internal.data }
                    }
                } else if (typeOpName === "PaginateAppend") {
                    const existingData = ps[name].data
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
                                    const exitingList = this.getPropAccess(existingData, propAccess)
                                    if (exitingList) {
                                        return [...exitingList, ...newD]
                                    } else {
                                        newD
                                    }
                                }
                            })
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
                    } else { // In Pagination scenario if request fails keep the old data but pass error
                        s = { ...ps, [name]: { ...ai.data, data: existingData } }
                    }
                } else if (typeOpName === "PaginatePrepend") {
                    const existingData = ps[name].data
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
                                    const exitingList = this.getPropAccess(existingData, propAccess)
                                    if (exitingList) {
                                        return [...newD, ...exitingList,]
                                    } else {
                                        newD
                                    }
                                }
                            })
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
                                    no = { ...ai.data, data: [...data, ...existingData] }
                                } else {
                                    no = { ...ai.data, data: data }
                                }
                            }
                        }
                        s = { ...ps, [name]: no }
                    } else { // In Pagination scenario if request fails keep the old data but pass error
                        s = { ...ps, [name]: { ...ai.data, data: existingData } }
                    }
                }
            }
        }
        else {
            s = rg.r(ps, a)
        }
        if (s !== ps) {
            (this._state as any)[stateKey] = s
            // notify listeners 
            const changedStateKeys = TStoreUtils.removeDuplicatesInArray([stateKey, ...stateKeysModifiedByTypeOps])
            this.notifyStorageOrListeners({ stateKeys: changedStateKeys, action: a, ps: ps })
        }
    }

    private setPropAccessImmutable = (obj: any, propAccess: string[], value: (prev: any) => any): any | undefined => {
        let newO = { ...obj }
        propAccess.some((key, i) => {
            if (i === propAccess.length - 1) {
                obj[key] = value(newO[key])
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

    private getPropAccess = (obj: any, propAccess: string[]): any => {
        if (propAccess.length === 1) {
            return obj[propAccess[0]]
        } else {
            return this.getPropAccess(obj[propAccess[0]], propAccess.slice(1))
        }
    }

    private async notifyStorageOrListeners({ stateKeys, action, ps }: { stateKeys: string[], action: Action, ps: any }) {
        if (this.storage && this.storage.options.writeMode === StorageWriteMode.REQUIRED) {
            await this.notifyStorage(stateKeys, action)
            this.notifyListeners({ stateKeys, action, ps })
        } else {
            this.notifyListeners({ stateKeys, action, ps })
            if (this.storage) {
                this.notifyStorage(stateKeys, action)
            }
        }
    }

    private notifyStorage(stateKeys: string[], action: Action) {
        const data = stateKeys.reduce((pv, ck) => {
            pv[ck] = JSON.stringify(this._state[ck])
            return pv;
        }, {} as Record<string, string>)
        return this.storage!.dataChanged(data)
    }


    private notifyListeners({ stateKeys, action, ps }: { stateKeys: string[], action: Action, ps: any }) {
        if (this._globalListener) {
            this._globalListenerData = { prevState: ps, stateKeys }
            this._globalListener(action)
        } else {
            stateKeys.forEach(stateKey => {
                const slrs = this.selectorListeners[stateKey]
                slrs.forEach(slr => {
                    if (this.isSelectorDependenciesChanged(this._state[stateKey], ps, slr.selector, stateKey)) {
                        slr.listener(action)
                    }
                })
            })

        }
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
        let result = false
        let pvProcessed: any | undefined = pv
        let cvProcessed: any | undefined = cv
        objAccess.split(".").forEach(v => {
            if (pvProcessed && cvProcessed) {
                const lvp = pvProcessed[v]
                if (!lvp) {
                    return result
                }
                const lvc = cvProcessed[v]
                if (lvp !== lvc) {
                    return true
                }
                pvProcessed = lvp
                cvProcessed = lvc
            }
        })
        return result
    }

    isSelectorDependenciesChanged = (currentSate: any, prevState: any, selector: Selector<any, any, any>, keyChanged: string): boolean => {
        const deps = selector.dependencies as Record<string, string[]>
        let result = false
        Object.entries(deps).forEach(([key, value]) => {
            if (keyChanged === key) {
                if (value.length > 0) {
                    value.forEach(oa => {
                        const oaChanged = this.isObjectKeysChanged(prevState, currentSate, oa)
                        if (oaChanged) {
                            return true
                        }
                    })
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
    subscribeSelector<SR>(selector: Selector<GetStateFromReducers<R>, any, SR>, listener: Callback, tag?: string) {

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



    //TODO we need to invalidate currentState
    private resetObjectAccess = (stateKey: string, objAccess: string) => {
        const currentState = this._state[stateKey]
        const defaultSatate = this.reducers[stateKey].ds
        let v: any = defaultSatate
        const oaa = objAccess.split(".").slice(1)
        const exv: string[] = []
        oaa.forEach(oa => {
            if (v[oa]) {
                v = v[oa]
                exv.push(oa)
            } else {
                return
            }
        })
        TStoreUtils.setNestedKey(currentState, exv, v)
    }

    /** 
     *  
     */
    resetSelectorDepsToDefaultSate = (selector: Selector<GetStateFromReducers<R>, any, any>) => {
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
    _subscribeGlobal(callback: Callback) {
        this._globalListener = callback
        return () => {
            this._globalListener = undefined
            this._globalListenerData = undefined
        }
    }


}


type X = NonNullable<undefined | string>
// type A1 = undefined
// type A2 = { name: "a2", group: "g2" }
// type G1S = { books: { name: string }[] }
// const g1: ReducerGroup<G1S, A2, "g1", undefined> = { r: null as any, g: "g1", ds: null as any, m: {} }
// const g2: ReducerGroup<G1S, A2, "g2", undefined> = { r: null as any, g: "g2", ds: null as any, m: {} }
// const sr = { g1, g2 }
// const store = new TypeSafeStore({ reducers: sr, middleWares: [] })

// type AT = GetActionFromReducers<typeof sr>
// store.dispatch({name:})
// store.subscribe(["g1",], null as any)

