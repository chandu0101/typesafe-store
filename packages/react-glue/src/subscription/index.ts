

//@ts-ignore
import { TypeSafeStore, ReducerGroup, Selector, Action, GetStateFromReducers, } from "@typesafe-store/store"



export class Subscription<R extends Record<string, ReducerGroup<any, any, any, any>>> {

    globalListener = (action: Action) => {
        const changedData = this.store._globalListenerData!
        const changedListeners: any[] = []
        this.store.selectorListeners[changedData.stateKey].forEach(sl => {
            const changed = this.store.isSelectorDependenciesChanged(this.store.state[changedData.stateKey], changedData.prevState, sl.selector, changedData.stateKey)
            if (changed) {
                changedListeners.push(sl.listener)
            }
        })
        changedListeners.forEach(l => { // TODO batching https://stackoverflow.com/questions/61002877/how-to-get-current-react-component-name-inside-custom-react-hook
            l()
        })
        this.store._globalListenerData = undefined
    }
    private globalUnsubscribeFn: () => any
    constructor(private readonly store: TypeSafeStore<R>) {
        this.globalUnsubscribeFn = store._subscribeGlobal(this.globalListener)
    }

    listenSelector<SR>(selector: Selector<GetStateFromReducers<R>, any, SR>, listener: () => any, tag: string) {
        return this.store.subscribeSelector(selector, listener, tag)
    }

    trySubscribe() {
        this.globalUnsubscribeFn = this.store._subscribeGlobal(this.globalListener)
    }

    tryUnSubscribe() {
        this.globalUnsubscribeFn()
    }

}
