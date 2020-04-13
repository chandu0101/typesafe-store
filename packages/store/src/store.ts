import { ReducerGroup, Action } from "./reducer"
import { PersistanceStorage, StorageWriteMode } from "./storage"
import compose from "./compose"
import { Selector } from "./selector"
import { Navigation, NAVIGATION_REDUCER_GROUP_NAME, Location, NavigationAction } from "./navigation"

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

    _unsubscribeNavigationListener?: () => void

    readonly selectorListeners: Record<keyof GetStateFromReducers<R>, { selector: Selector<GetStateFromReducers<R>, any, any>, listener: Callback, tag?: string }[]> = {} as any

    /**
     *  used for framework integrations
     */
    _globalListenerData?: { prevState: any, stateKey: string }

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
        let s: typeof ps = null as any
        if (_internal && _internal.processed && _internal.data) { // processed by middlewares (example: fetch,graphql)
            s = { ...ps, [name]: _internal.data }
        } else {
            s = rg.r(ps, a)
        }
        if (s !== ps) {
            (this._state as any)[stateKey] = s
            // notify listeners 
            this.notifyStorageOrListeners(stateKey, a, ps)
        }
    }

    private async notifyStorageOrListeners(stateKey: string, action: Action, ps: any) {
        if (this.storage && this.storage.options.writeMode === StorageWriteMode.REQUIRED) {
            await this.notifyStorage(stateKey, action)
            this.notifyListeners(stateKey, action, ps)
        } else {
            this.notifyListeners(stateKey, action, ps)
            if (this.storage) {
                this.notifyStorage(stateKey, action)
            }
        }
    }

    private notifyStorage(stateKey: string, action: Action) {
        return this.storage!.dataChanged({ [stateKey]: JSON.stringify(this._state[stateKey]) })
    }

    private notifyListeners(stateKey: string, action: Action, ps: any) {
        if (this._globalListener) {
            this._globalListenerData = { prevState: ps, stateKey }
            this._globalListener(action)
        } else {
            const slrs = this.selectorListeners[stateKey]
            slrs.forEach(slr => {
                if (this.isSelectorDependenciesChanged(this._state[stateKey], ps, slr.selector, stateKey)) {
                    slr.listener(action)
                }
            })
        }

        // const skListeners = this.listeners[stateKey]
        // if (skListeners) {
        //     skListeners.forEach(c => {
        //         c(action)
        //     })
        // }
    }


    get state() {
        return this._state
    }

    getReducerGroup = (group: string) => {
        const stateKey = this.reducerGroupToStateKeyMap[group]
        return this.reducers[stateKey]
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

    // subscribe = <K extends keyof GetStateFromReducers<R>>(stateKeys: K[], callback: Callback) => {

    //     stateKeys.forEach(sk => {
    //         const el = this.listeners[sk]
    //         if (el) {
    //             el.push(callback)
    //         } else {
    //             this.listeners[sk] = [callback]
    //         }
    //     })

    //     let isSubscribed = true
    //     return (options?: UnsubscribeOptions) => {
    //         if (!isSubscribed) {
    //             return
    //         }
    //         const isResetToDefault = options && options.resetToDefault
    //         stateKeys.forEach(sk => {
    //             const lrs = this.listeners[sk]
    //             const index = lrs.indexOf(callback)
    //             lrs.splice(index, 1)
    //             if (isResetToDefault && lrs.length === 0) {
    //                 const rg = this.reducers[sk]
    //                 this._state[sk] = rg.ds
    //             }
    //         })
    //         isSubscribed = false
    //     }
    // }

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

    private setNestedKey = (obj: any, path: string[], value: any): any => {
        if (path.length === 1) {
            obj[path[0]] = value
            return
        }
        return this.setNestedKey(obj[path[0]], path.slice(1), value)
    }

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
        this.setNestedKey(currentState, exv, v)
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
                existingStateObjectAccesses = [...new Set(existingStateObjectAccesses)]
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

