

import { TypeSafeStore, ReducerGroup, Selector, Action, GetStateFromReducers, SelectorE, } from "@typesafe-store/store"
import { getBatch } from "../utils/batch"


export class Subscription<R extends Record<string, ReducerGroup<any, any, any, any>>> {

    globalListener = (action: Action, stateKey: string, ps: any) => {
        console.log("globalListener called :", action, "stateKey :", stateKey, "ps:", ps);
        const changedListeners: any[] = []
        this.store.selectorListeners[stateKey].forEach(sl => {
            console.log("selector : ", sl, this.store.state[stateKey]);
            const changed = this.store.isSelectorDependenciesChanged(this.store.state[stateKey], ps, sl.selector,
                stateKey)
            console.log("changed", changed);
            if (changed) {
                changedListeners.push(sl.listener)
            }
        })


        const batch = getBatch()
        batch(() => {
            changedListeners.forEach(l => {
                l()
            })
        })

    }
    private globalUnsubscribeFn: () => any
    constructor(private readonly store: TypeSafeStore<R>) {
        this.globalUnsubscribeFn = store._subscribeGlobal(this.globalListener)
    }

    listenSelector<SR>(selector: Selector<GetStateFromReducers<R>, SR> | SelectorE<GetStateFromReducers<R>, any, SR>,
        listener: () => any, tag: string) {
        return this.store.subscribeSelector(selector, listener, tag)
    }

    trySubscribe() {
        this.globalUnsubscribeFn = this.store._subscribeGlobal(this.globalListener)
    }

    tryUnSubscribe() {
        this.globalUnsubscribeFn()
    }

}
