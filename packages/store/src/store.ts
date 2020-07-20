import {
  ReducerGroup,
  Action,
  ActionInternalMeta,
  DataAndTypeOps,
} from "./reducer";
import { PersistanceStorage } from "./storage";
import compose from "./compose";
import { Selector } from "./selector";
import { TypeOpEntity } from "./typeops";
import {
  Navigation,
  NAVIGATION_REDUCER_GROUP_NAME,
  Location,
  NavigationAction,
} from "./navigation";
import { TStoreUtils } from "./utils";
import { NetWorkOfflineOptions } from "./offline";

/**
 *  store subscription will be called with current procesed action
 */
type Callback = (action: Action) => any;

export type Dispatch<A extends Action> = (action: A) => any;

export type MiddleWareInfo<S = any> = Readonly<{
  state: () => S;
  meta: Record<string, ReducerGroup<any, any, any, any>>;
}>;

export type GetStateFromReducers<
  T extends Record<string, ReducerGroup<any, any, any, any>>
> = {
  [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G, infer AA>
    ? S
    : any;
};

export type GetPartialStateFromReducers<
  T extends Record<string, ReducerGroup<any, any, any, any>>
> = Partial<
  {
    [K in keyof T]: T[K] extends ReducerGroup<
      infer S,
      infer A,
      infer G,
      infer AA
    >
      ? Partial<S>
      : any;
  }
>;

export type GetActionFromReducers<T> = {
  [K in keyof T]: T[K] extends ReducerGroup<infer S, infer A, infer G, infer AA>
    ? AA extends undefined
      ? A
      : A | AA
    : never;
}[keyof T];

export type MiddleWare<
  R extends Record<string, ReducerGroup<any, any, any, any>>
> = (
  store: TypeSafeStore<R>
) => (
  next: Dispatch<GetActionFromReducers<R>>
) => (action: GetActionFromReducers<R>) => any;

/**
 *  resetToDefault: while unsubscribing if you want to reset dependent state keys (keys you used to register) default values
 *   please note that it will reset to default only when those state keys are not used by others listeners/subscribers
 */
export type UnsubscribeOptions = { resetToDefault?: boolean };

type GlobalListenerCallBack = (
  action: Action,
  stateKey: string,
  ps: any
) => any;

type CompleteListenerCallback = (
  action: Action,
  stateKey: string,
  ps: any
) => any;

export class TypeSafeStore<
  R extends Record<string, ReducerGroup<any, any, any, any>>
> {
  private reducers: R;
  private _state: GetStateFromReducers<R> = {} as any;

  private reducerGroupToStateKeyMap: Record<string, string> = {};

  readonly storage?: PersistanceStorage;

  private _globalListener?: GlobalListenerCallBack;

  private _globalCompleteHandlers: CompleteListenerCallback[] = [];

  private typeOpsMata: Record<string, any> = {};

  private _unsubscribeNavigationListener?: () => void;

  private _unsubscribeNetworkStatusListener?: () => void;

  _onStoreReadyCallback?: () => void;

  readonly selectorListeners: Record<
    keyof GetStateFromReducers<R>,
    {
      selector: Selector<GetStateFromReducers<R>, any>;
      listener: Callback;
      tag?: string;
    }[]
  > = {} as any;

  private networkOfllineOptions?: NetWorkOfflineOptions & { actions: Action[] };

  /**
   *  use this when you set a persitance storage and to know whether state is loaded from storage or not
   */
  isReady = false;

  readonly dispatch: Dispatch<GetActionFromReducers<R>>;

  readonly navigation: Navigation;

  constructor({
    reducers,
    preloadState,
    networkOfflne,
    middleWares,
    storage,
    navigation,
  }: {
    reducers: R;
    middleWares: MiddleWare<R>[];
    preloadState?: GetPartialStateFromReducers<R>;
    navigation?: Navigation;
    storage?: PersistanceStorage;
    networkOfflne?: NetWorkOfflineOptions;
  }) {
    this.reducers = reducers;
    const mchain = middleWares.map((m) => m(this));
    this.storage = storage;
    this.dispatch = compose<Dispatch<Action>>(...mchain)(this.defaultDispatch);
    if (storage) {
      this.prepareStoreWithStorage(storage);
    } else {
      this.prepareNormalStore(preloadState);
      this.isReady = true;
    }
    if (navigation) {
      this.navigation = navigation;
      this.checkNavigationReducerAttached();
      this._unsubscribeNavigationListener = this.navigation.listen(
        this.handleLocationChange
      );
    } else {
      // react-native or similar environments
      this.navigation = "lazyNavigation" as any;
    }
    if (networkOfflne) {
      this.setNetWorkOptions(networkOfflne);
    }
  }

  private setNetWorkOptions = async (np: NetWorkOfflineOptions) => {
    this.networkOfllineOptions = { ...np, actions: [] };
    this._unsubscribeNetworkStatusListener = np.statusListener.listen(
      this.handleNetworkStatusChange
    );
  };

  private handleNetworkStatusChange = (status: boolean) => {
    if (status) {
      if (this.networkOfllineOptions?.actions) {
        this.processNetworkOfflineAction(this.networkOfllineOptions!.actions);
      }
    }
  };

  private processNetworkOfflineAction = (actions: Action[]) => {
    if (actions.length > 0) {
      const ac = [...actions];
      this.networkOfllineOptions!.actions = [];
      this.storage?.setOfflineActions(null);
      ac.forEach((a) => {
        this.dispatch(a as any);
      });
    }
  };

  addNetworkOfflineAction = (action: Action) => {
    const nOffOptions = this.networkOfllineOptions;
    if (nOffOptions) {
      nOffOptions.actions.push(action);
      if (this.storage) {
        this.storage.setOfflineActions(nOffOptions.actions);
      }
    } else {
      if (process.env.NODE_ENV !== "production") {
        throw new Error(
          `You must specify "networkOfflne" config key while creating store`
        );
      }
    }
  };

  private checkNavigationReducerAttached = () => {
    if (process.env.NODE_ENV !== "production") {
      const nv = this.reducers["navigation"];
      if (!nv || nv.g !== NAVIGATION_REDUCER_GROUP_NAME) {
        throw new Error(`You provided navigation to store but didn't configured reducer
                NavigationReducerGroup in reducers
                 `);
      }
    }
  };

  /**
   *  provide a way to set navigation lazily
   * @param navigation
   */
  setNavigation = (navigation: Navigation) => {
    if (this._unsubscribeNavigationListener) {
      this._unsubscribeNavigationListener();
    }
    (this as any).navigation = navigation;
    this.checkNavigationReducerAttached();
    this._unsubscribeNavigationListener = this.navigation.listen(
      this.handleLocationChange
    );
  };

  private handleLocationChange = (loc: Location) => {
    const a: NavigationAction = {
      name: "setLocation",
      group: NAVIGATION_REDUCER_GROUP_NAME,
      payload: loc,
    };
    this.dispatch(a as any);
  };

  /**
   *
   *
   */
  private prepareNormalStore = (
    storageData?: GetPartialStateFromReducers<R>
  ) => {
    for (const stateKey in this.reducers) {
      const rg = this.reducers[stateKey];
      if (rg) {
        const assignedToAnotherStateKey = this.reducerGroupToStateKeyMap[rg.g];
        if (assignedToAnotherStateKey) {
          throw new Error(
            `This reducer ${rg.g} already assigned to ${assignedToAnotherStateKey}`
          );
        }
        this.reducerGroupToStateKeyMap[rg.g] = stateKey;
        if (!storageData) {
          this._state[stateKey] = rg.ds;
        } else {
          const sd = storageData[stateKey] as any;
          if (sd) {
            this._state[stateKey] = { ...rg.ds, ...sd };
          } else {
            this._state[stateKey] = rg.ds;
          }
        }
      } else if (storageData) {
        this._state[stateKey] = storageData[stateKey] as any;
      }
    }
  };

  prepareStoreWithStorage = async (
    storage: PersistanceStorage,
    preloadState?: GetPartialStateFromReducers<R>
  ) => {
    try {
      const sState = await storage.getState(Object.keys(this.reducers));
      if (sState && !TStoreUtils.isEmptyObj(sState)) {
        if (preloadState) {
          const s = Object.keys(this.reducers).reduce((prv, key) => {
            const sv = sState[key];
            const pv = preloadState[key];
            if (sv && pv) {
              if (storage.options.preloadloadMerge === "STORAGE_HIGH_PRI") {
                prv[key] = { ...pv, ...sv };
              } else {
                prv[key] = { ...sv, ...pv };
              }
            } else {
              const v = sv ? sv : pv;
              if (v) {
                prv[key] = v;
              }
            }
            return prv;
          }, {} as Record<string, any>);
          this.prepareNormalStore(s as any);
        } else {
          this.prepareNormalStore(sState as any);
        }
      } else {
        // first time
        this.prepareNormalStore(preloadState);
      }
    } finally {
      this.isReady = true;
      if (this._onStoreReadyCallback) {
        this._onStoreReadyCallback();
      }
      const actions = await this.storage!.getOfflineActions();
      if (actions !== null) {
        this.processNetworkOfflineAction(actions);
      }
    }
  };

  private defaultDispatch = (a: Action) => {
    const { group, name, _internal } = a;
    const stateKey = this.reducerGroupToStateKeyMap[group];
    if (!stateKey) {
      throw new Error(`Looks like you defined reducer as lazy reducer but didn't added back,
             please use "store.resetReducer" to add it back.
             `);
    }
    const rg = this.reducers[stateKey];
    const ps = this._state[stateKey];
    let newState: any = ps;

    if (_internal && _internal.processed) {
      // processed by middlewares (example: fetch,graphql)
      if (_internal.kind === "Data") {
        newState = { ...newState, [name]: _internal.data };
      } else if (_internal.kind === "State") {
        newState = _internal.data;
      } else if (_internal.kind === "DataAndTypeOps") {
        const ai = _internal;
        const typeOpName = ai.typeOp.name;
        if (
          typeOpName === "AppendToList" ||
          typeOpName === "AppendToListAndDiscard" ||
          typeOpName === "PrependToList" ||
          typeOpName === "PrependToListAndDiscard"
        ) {
          newState = TypeOpsUtils.handleAppendPrependList({ newState, ai });
        } else if (
          typeOpName === "UpdateList" ||
          typeOpName === "UpdateListAndDiscard"
        ) {
          newState = TypeOpsUtils.handleUpdateList({
            newState,
            ai,
            group,
            typeOpsMata: this.typeOpsMata,
          });
        } else if (
          typeOpName === "DeleteFromList" ||
          typeOpName === "DeleteFromListAndDiscard"
        ) {
          newState = TypeOpsUtils.handleDeleteList({
            newState,
            ai,
            name,
            group,
            typeOpsMata: this.typeOpsMata,
          });
        } else if (
          typeOpName === "PaginateAppend" ||
          typeOpName === "PaginatePrepend"
        ) {
          newState = TypeOpsUtils.handlePaginateAppendPrepend({
            newState,
            ai,
            name,
          });
        }
      }
    } else {
      newState = rg.r(ps, a);
    }
    this._state = { ...this._state, [stateKey]: newState };
    // notify listeners
    this.notifyStorageOrListeners({
      stateKey,
      action: a,
      ps: ps,
    });
  };

  private notifyStorageOrListeners = async ({
    stateKey,
    action,
    ps,
  }: {
    stateKey: string;
    action: Action;
    ps: any;
  }) => {
    if (
      this.storage &&
      this.storage.options.writeMode &&
      ((typeof this.storage.options.writeMode === "string" &&
        this.storage.options.writeMode === "REQUIRED") ||
        (typeof this.storage.options.writeMode === "function" &&
          this.storage.options.writeMode(stateKey) === "REQUIRED"))
    ) {
      try {
        await this.notifyStorage(stateKey);
      } catch (error) {
        if (
          this.storage.isQuotaExceededError(error) &&
          this.storage.options.onQuotaExceededError
        ) {
          await this.storage.options.onQuotaExceededError(this.storage, error);
        } else {
          throw error;
        }
      }
      this.notifyListeners({ stateKey, action, ps });
    } else {
      this.notifyListeners({ stateKey, action, ps });
      if (this.storage) {
        this.notifyStorage(stateKey).catch((error) => {
          if (
            this.storage?.isQuotaExceededError(error) &&
            this.storage.options.onQuotaExceededError
          ) {
            this.storage.options.onQuotaExceededError(this.storage, error);
          } else {
            throw error;
          }
        });
      }
    }
  };

  private notifyStorage = async (stateKey: string) => {
    const persistMode = this.storage!.options.persistMode;
    let v: any | undefined = undefined;
    const rg = this.getReducerGroup(stateKey);
    const eo = this._state[stateKey];
    if (persistMode === "epxlicitPersist") {
      if (rg.m.persist) {
        v = eo;
      } else if (rg.m.persistKeys) {
        const obj = TStoreUtils.pickKeys(eo, rg.m.persistKeys);
        v = obj;
      }
    } else {
      if (rg.m.dpersist) {
        // dont persist
      } else if (rg.m.dpersistKeys) {
        const obj = TStoreUtils.excludeKeys(eo, rg.m.dpersistKeys);
        v = obj;
      } else {
        v = eo;
      }
    }
    if (v !== undefined) {
      this.storage!.dataChanged(stateKey, v);
    }
  };

  private notifyListeners = ({
    stateKey,
    action,
    ps,
  }: {
    stateKey: string;
    action: Action;
    ps: any;
  }) => {
    if (this._globalListener) {
      this._globalListener(action, stateKey, ps);
    } else {
      const slrs = this.selectorListeners[stateKey];
      console.log("listeners length : ", slrs.length);
      slrs.forEach((slr) => {
        if (
          this.isSelectorDependenciesChanged(
            this._state[stateKey],
            ps,
            slr.selector,
            stateKey
          )
        ) {
          slr.listener(action);
        }
      });
    }
    this._globalCompleteHandlers.forEach((c) => {
      console.log("calling completion handler ", c);
      c(action, stateKey, ps);
    });
  };

  get state() {
    return this._state;
  }

  getReducerGroup = (group: string) => {
    const stateKey = this.reducerGroupToStateKeyMap[group];
    return this.reducers[stateKey];
  };

  getStateKeyForGroup = (group: string) => {
    return this.reducerGroupToStateKeyMap[group];
  };

  /**
   *  add lazy reducers (useful while code splitting)
   *
   */
  resetReducer = <K extends keyof GetStateFromReducers<R>>(
    key: K,
    rg: R[K]
  ) => {
    this.reducers[key] = rg;
    this.reducerGroupToStateKeyMap[rg.g] = key as any;
    this._state = { ...this._state, [key]: rg.ds };
  };

  private isObjectKeysChanged = (pv: any, cv: any, objAccess: string) => {
    console.log("isObjectKeysChanged********* ", pv, cv, objAccess);
    let result = false;
    let pvProcessed: any | undefined = pv;
    let cvProcessed: any | undefined = cv;
    result = objAccess.split(".").some((v) => {
      if (pvProcessed && cvProcessed) {
        const lvp = pvProcessed[v];
        const lvc = cvProcessed[v];
        if (
          (lvp === undefined || lvp === null) &&
          (lvc === undefined || lvc === null)
        ) {
          return false;
        }
        if (lvp !== lvc) {
          return true;
        }
        pvProcessed = lvp;
        cvProcessed = lvc;
      }
    });
    return result;
  };

  isSelectorDependenciesChanged = (
    currentSate: any,
    prevState: any,
    selector: Selector<any, any>,
    keyChanged: string
  ): boolean => {
    console.log(
      "isSelectorDependenciesChanged ",
      currentSate,
      prevState,
      selector.dependencies,
      keyChanged
    );
    const deps = selector.dependencies;
    let result = false;
    if (currentSate === prevState) {
      console.log("same as previous");
      return false;
    }
    result = Object.entries(deps).some(([key, value]) => {
      if (keyChanged === key) {
        if (value.length > 0) {
          const lr = value.some((oa) => {
            const oaChanged = this.isObjectKeysChanged(
              prevState,
              currentSate,
              oa
            );
            if (oaChanged) {
              return true;
            }
          });
          if (lr === true) {
            return lr;
          }
        } else {
          if (currentSate !== prevState) {
            return true;
          }
        }
      }
    });
    return result;
  };

  /**
   *
   * @param selector
   * @param listener
   * @param tag component name in which
   */
  subscribeSelector = <SR>(
    selector: Selector<GetStateFromReducers<R>, SR>,
    listener: Callback
  ) => {
    const keys = Object.keys(selector.dependencies);

    keys.forEach((k) => {
      const sls = this.selectorListeners[k];
      const v = { selector, listener };
      if (sls) {
        sls.push(v);
      } else {
        (this.selectorListeners as any)[k] = [v];
      }
    });
    let isSubscribed = true;

    return (options?: UnsubscribeOptions) => {
      if (!isSubscribed) {
        return;
      }
      keys.forEach((k) => {
        const sla = this.selectorListeners[k];
        if (sla) {
          let index = -1;
          sla.forEach((sl, i) => {
            if (sl.selector === selector && sl.listener === sl.listener) {
              index = i;
            }
          });
          sla.splice(index, 1);
        }
      });
      if (options && options.resetToDefault) {
        this.resetSelectorDepsToDefaultSate(selector);
      }

      isSubscribed = false;
    };
  };

  private resetObjectAccess = (stateKey: string, objAccess: string) => {
    const currentState = this._state[stateKey];
    const defaultSatate = this.reducers[stateKey].ds;
    let v: any = defaultSatate;
    const oaa = objAccess.split(".").slice(1);
    const exv: string[] = [];
    oaa.some((oa) => {
      if (v[oa]) {
        v = v[oa];
        exv.push(oa);
      } else {
        return true;
      }
    });
    TStoreUtils.setPropAccessImmutable(currentState, exv, (prv: any) => v);
  };

  /**
   *
   */
  resetSelectorDepsToDefaultSate = (
    selector: Selector<GetStateFromReducers<R>, any>
  ) => {
    Object.entries(selector.dependencies).forEach(([key, values]) => {
      const stateKey = key as any;
      const sls = this.selectorListeners[stateKey];
      if (sls && sls.length > 0) {
        let existingStateObjectAccesses: string[] = [];
        sls.forEach((sl) => {
          existingStateObjectAccesses.push(
            ...sl.selector.dependencies[stateKey]
          );
        });
        existingStateObjectAccesses = TStoreUtils.removeDuplicatesInArray(
          existingStateObjectAccesses
        );
        values.forEach((v) => {
          const exist =
            existingStateObjectAccesses.filter(
              (ea) => ea.includes(v) || v.includes(ea)
            ).length > 0;
          if (!exist) {
            //
            this.resetObjectAccess(stateKey, v);
          }
        });
      } else {
        // no listeners for this key
        (this._state as any)[stateKey] = this.reducers[stateKey].ds;
      }
    });
  };

  /**
   *  used for framework integrationions
   * @param callback
   */
  _subscribeGlobal = (callback: GlobalListenerCallBack) => {
    this._globalListener = callback;
    return () => {
      this._globalListener = undefined;
    };
  };

  _addCompleteHook = (callback: CompleteListenerCallback) => {
    this._globalCompleteHandlers.push(callback);
    return () => {
      this._globalCompleteHandlers = this._globalCompleteHandlers.filter(
        (h) => h !== callback
      );
    };
  };

  cleanup() {
    if (this._unsubscribeNavigationListener) {
      this._unsubscribeNavigationListener();
    }
    if (this._unsubscribeNetworkStatusListener) {
      this._unsubscribeNetworkStatusListener();
    }
  }
}

class TypeOpsUtils {
  static handleAppendPrependList(input: { newState: any; ai: DataAndTypeOps }) {
    let { newState, ai } = input;
    const typeOpName = ai.typeOp.name;
    const propAccess = ai.typeOp.propAccess;
    const discard =
      typeOpName === "AppendToListAndDiscard" ||
      typeOpName === "PrependToListAndDiscard";
    if (ai.optimisticFailed) {
      // revert back state changes
      console.log("Optimistic failed : ", newState);
      const result = TStoreUtils.setPropAccessImmutable(
        newState,
        propAccess!.split("."),
        (prev: TypeOpEntity) => {
          console.log("Optimistic failed : prev,", prev);
          if (!prev) {
            return prev;
          } else {
            const [id, idKey] = this.getIdValueAndIdKey(ai.optimisticFailed);
            return prev.filter((i) => (i as any)[idKey] !== id);
          }
        }
      );
      if (result) {
        newState = result;
      }
      newState = { ...newState, [name]: ai.data };
    } else if (ai.data.data) {
      // success response
      const data = ai.data.data;
      console.log("Before transformation : ", newState, propAccess);
      const result = TStoreUtils.setPropAccessImmutable(
        newState,
        propAccess!.split("."),
        (prev: TypeOpEntity) => {
          console.log("*********** prev value : ", prev);
          if (!prev) {
            return [data];
          } else {
            if (ai.optimisticSuccess) {
              // previously appended to list so just replace previous value
              const [id, idKey] = this.getIdValueAndIdKey(ai.optimisticSuccess);
              return prev.map((i) =>
                (i as any)[idKey] === id ? { ...i, ...data } : i
              );
            }
            if (
              typeOpName === "AppendToList" ||
              typeOpName === "AppendToListAndDiscard"
            ) {
              return prev.concat(data);
            } else {
              return [data, ...prev];
            }
          }
        }
      );
      console.log("After transformation : ", result);
      if (result) {
        newState = result;
      }
      if (discard) {
        newState = { ...newState, [name]: {} }; // Note: Currently we only support types ops on Fetch fields so we can assume that value is object
      } else {
        newState = { ...newState, [name]: ai.data };
      }
    } else {
      newState = { ...newState, [name]: ai.data };
    }
    return newState;
  }

  static handleUpdateList(input: {
    newState: any;
    group: string;
    ai: DataAndTypeOps;
    typeOpsMata: Record<string, any>;
  }) {
    let { newState, ai, group, typeOpsMata } = input;
    const typeOpName = ai.typeOp.name;
    const propAccess = ai.typeOp.propAccess;
    const discard = typeOpName === "UpdateListAndDiscard";
    if (ai.optimisticFailed) {
      // revert back state changes
      const result = TStoreUtils.setPropAccessImmutable(
        newState,
        propAccess!.split("."),
        (prev: TypeOpEntity) => {
          if (!prev) {
            return prev;
          } else {
            const [id, idKey] = this.getIdValueAndIdKey(ai.optimisticFailed);

            const key = `${name}_${group}_${id}`;
            const originalValue = typeOpsMata[key];
            console.log("Optimistic failed: ", id, originalValue);
            return prev.map((i) =>
              (i as any)[idKey] === id ? { ...i, ...originalValue } : i
            );
          }
        }
      );
      if (result) {
        newState = result;
      }
      newState = { ...newState, [name]: ai.data };
    } else if (ai.data.data) {
      // success response
      const data = ai.data.data;
      const result = TStoreUtils.setPropAccessImmutable(
        newState,
        propAccess!.split("."),
        (prev: TypeOpEntity) => {
          if (!prev) {
            return [data];
          } else {
            const [id, idKey] = this.getIdValueAndIdKey(data);
            const key = `${name}_${group}_${id}`;
            if (!typeOpsMata[key]) {
              typeOpsMata[key] = prev.find((i) => (i as any)[idKey] === id); //store original object , incase of server failure, we'll revert back
            } else {
              typeOpsMata[key] = undefined;
            }
            return prev.map((i) =>
              (i as any)[idKey] === id ? { ...i, ...data } : i
            );
          }
        }
      );
      if (result) {
        newState = result;
      }
      if (discard) {
        newState = { ...newState, [name]: {} }; // Note: Currently we only support types ops on Fetch fields so we can assume that value is object
      } else {
        newState = { ...newState, [name]: ai.data };
      }
    } else {
      newState = { ...newState, [name]: ai.data };
    }
    return newState;
  }

  static handleDeleteList(input: {
    newState: any;
    ai: DataAndTypeOps;
    typeOpsMata: Record<string, any>;
    group: string;
    name: string;
  }) {
    let { newState, ai, name, group, typeOpsMata } = input;
    const typeOpName = ai.typeOp.name;
    const propAccess = ai.typeOp.propAccess;
    const discard = typeOpName === "DeleteFromListAndDiscard";
    if (ai.optimisticFailed) {
      // revert back state changes
      const result = TStoreUtils.setPropAccessImmutable(
        newState,
        propAccess!.split("."),
        (prev: TypeOpEntity) => {
          if (!prev) {
            return prev;
          } else {
            const [id, idKey] = this.getIdValueAndIdKey(ai.optimisticFailed);
            const key = `${name}_${group}_${id}`;
            const [index, v] = typeOpsMata[key];
            if (index) {
              const na = [...prev];
              na.splice(index, 0, v);
              typeOpsMata[key] = undefined;
              return na;
            } else {
              return prev;
            }
          }
        }
      );
      if (result) {
        newState = result;
      }
      newState = { ...newState, [name]: ai.data };
    } else if (ai.data.data) {
      // success response
      const data = ai.data.data;
      const result = TStoreUtils.setPropAccessImmutable(
        newState,
        propAccess!.split("."),
        (prev: TypeOpEntity) => {
          if (!prev) {
            return prev;
          } else {
            if (ai.optimisticSuccess) {
              const [id, idKey] = this.getIdValueAndIdKey(data);
              const key = `${name}_${group}_${id}`;
              typeOpsMata[key] = undefined;
              return prev; // already deleted
            } else {
              const [id, idKey] = this.getIdValueAndIdKey(data);
              let index = -1;
              let vatIndex: any = null;
              const na = prev.filter((v, i) => {
                if ((v as any)[idKey] === id) {
                  index = i;
                  vatIndex = v;
                  return false;
                } else {
                  return true;
                }
              });
              if (index > -1) {
                const [id, idKey] = this.getIdValueAndIdKey(data);
                const key = `${name}_${group}_${id}`;
                typeOpsMata[key] = [index, vatIndex];
              }
              return na;
            }
          }
        }
      );
      if (result) {
        newState = result;
      }
      if (discard) {
        newState = { ...newState, [name]: {} }; // Note: Currently we only support types ops on Fetch fields so we can assume that value is object
      } else {
        newState = { ...newState, [name]: ai.data };
      }
    } else {
      newState = { ...newState, [name]: ai.data };
    }
    return newState;
  }

  static handlePaginateAppendPrepend(input: {
    newState: any;
    ai: DataAndTypeOps;
    name: string;
  }) {
    let { newState, ai, name } = input;
    const typeOpName = ai.typeOp.name;
    const propAccess = ai.typeOp.propAccess;
    const existingData = newState[name].data;
    console.log("************ PaginateAppend/Prepend", existingData, ai);
    let no: any = ai.data;
    const propAccessA = propAccess ? propAccess.split(".") : [];
    if (ai.optimisticFailed) {
      // revert back state changes
      if (propAccessA.length > 0) {
        const newData = TStoreUtils.setPropAccessImmutable(
          existingData,
          propAccessA,
          (prvA: any) => {
            const ids = TStoreUtils.getPropAccess(
              ai.optimisticFailed,
              propAccessA
            ).map((d: any) => d.id || d._id) as string[];
            const na = prvA.filter((o: any) => {
              const oid = o.id || o._id;
              if (ids.includes(oid)) {
                return false;
              } else {
                return true;
              }
            });
            return na;
          }
        );

        no = { ...ai.data, data: newData };
      } else {
        const ids = ai.optimisticFailed.map(
          (d: any) => d.id || d._id
        ) as string[];
        const newA = existingData.filter(
          (o: any) => !ids.includes(o.id || o._id)
        );
        no = { ...ai.data, data: newA };
      }
      newState = { ...newState, [name]: ai.data };
    } else if (ai.data.data) {
      // success response
      const data = ai.data.data;
      console.log("************########********** success case :", propAccess);
      if (propAccessA.length > 0) {
        const newData = TStoreUtils.setPropAccessImmutable(
          data,
          propAccessA,
          (newD: any) => {
            if (ai.optimisticSuccess) {
              const ids = TStoreUtils.getPropAccess(
                ai.optimisticSuccess,
                propAccessA
              ).map((d: any) => d.id || d._id) as string[];
              const exitingList = TStoreUtils.getPropAccess(
                existingData,
                propAccessA
              );
              const na = exitingList.map((o: any) => {
                const oid = o.id || o._id;
                if (ids.includes(oid)) {
                  return { ...o, ...newD.find((o: any) => o.id === oid) };
                } else {
                  return o;
                }
              });
              return na;
            } else {
              let exitingList: any | undefined = undefined;
              console.log(" in side : existingData: ", existingData);
              if (existingData) {
                exitingList = TStoreUtils.getPropAccess(
                  existingData,
                  propAccessA
                );
                console.log("Entered here ");
              }
              console.log("******* existing list : ", exitingList, newD);
              if (exitingList) {
                let result = [];
                if (typeOpName === "PaginateAppend") {
                  result = [...exitingList, ...newD];
                } else {
                  result = [...newD, ...exitingList];
                }
                return result;
              } else {
                return newD;
              }
            }
          }
        );
        console.log("************** newData: ", newData);
        no = { ...ai.data, data: newData };
      } else {
        if (ai.optimisticSuccess) {
          const ids = ai.optimisticSuccess.map(
            (d: any) => d.id || d._id
          ) as string[];
          const na = existingData.map((o: any) => {
            const oid = o.id || o._id;
            if (ids.includes(oid)) {
              return { ...o, ...data.find((o: any) => o.id === oid) };
            } else {
              return o;
            }
          });
          no = { ...ai.data, data: na };
        } else {
          if (existingData) {
            let d = null as any;
            if (typeOpName === "PaginateAppend") {
              d = [...existingData, ...data];
            } else {
              d = [...data, ...existingData];
            }
            no = { ...ai.data, data: d };
          } else {
            no = { ...ai.data, data: data };
          }
        }
      }
      newState = { ...newState, [name]: no };
    } else {
      // In Pagination scenario if request loading / fails keep the old data but pass error/
      console.log("Entered loading/error ");
      newState = { ...newState, [name]: { ...ai.data, data: existingData } };
    }
    return newState;
  }

  private static getIdValueAndIdKey(obj: any): [any, string] {
    let id: any = null as any;
    let idKey: string = "";
    if (obj.id) {
      idKey = "id";
      id = obj.id;
    } else {
      idKey = "_id";
      id = obj._id;
    }
    return [id, idKey];
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
