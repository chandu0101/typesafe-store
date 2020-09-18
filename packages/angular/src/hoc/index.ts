import { ɵɵdirectiveInject as directiveInject, } from '@angular/core';
import NgTStore from '../service';
import { Selector, UnsubscribeOptions, Dispatch, Action, TypeSafeStore } from '@typesafe-store/store';


type TStoreConnectProps = Record<string, { selector: Selector<any, any>, options?: UnsubscribeOptions }>

export type TStoreConnectInjectedProps<A extends Action> = {
    dispatch: Dispatch<A>
}

export function TStoreConnect(props: TStoreConnectProps) {

    return (cls: any) => {

        const FACTORY_KEY = "ɵfac"
        const COMPONENT_KEY = "ɵcmp"
        const origFact = cls[FACTORY_KEY]
        const compOrig = cls[COMPONENT_KEY];
        const STORE_KEY = "_store"
        const STORE_META_KEY = "_tstore_meta"
        const DISPATCH_KEY = "dispatch"
        let instance = null
        cls[FACTORY_KEY] = () => {
            const c = origFact(compOrig.type)
            const ts = directiveInject(NgTStore)
            c[STORE_KEY] = ts.store
            c[STORE_META_KEY] = { selectors: {}, unsubs: [] }
            Object.entries(props).forEach(([key, value]) => {
                c[STORE_META_KEY]["selectors"][key] = value
                const listener = () => {
                    c[key] = c[STORE_META_KEY]["selectors"][key].fn(c[STORE_KEY].state)
                }
                const us = c[STORE_KEY].subscribeSelector(value.selector, listener)
                c[STORE_META_KEY].unsubs.push([us, value.options])
                c[key] = value.selector.fn(c[STORE_KEY].state)
            })
            c[DISPATCH_KEY] = ts.store.dispatch
            instance = c;
            return c;
        }
        const origDestory = compOrig.onDestroy
        compOrig["onDestroy"] = () => {
            if (origDestory) {
                origDestory.call(instance)
            }
            const unubs: [(options?: any) => void, any][] = instance[STORE_META_KEY].unsubs
            unubs.forEach(([cb, options]) => {
                cb(options)
            })
        }
        return cls;
    }
}

export type ProviderInjectedProps<A extends Action> = {
    dispatch: Dispatch<A>
    isTStoreReady: boolean
}

export function Provider(store: TypeSafeStore<any>) {

    return (cls: any) => {

        const FACTORY_KEY = "ɵfac"
        const COMPONENT_KEY = "ɵcmp"
        const origFact = cls[FACTORY_KEY]
        const compOrig = cls[COMPONENT_KEY];
        const STORE_KEY = "_store"
        const DISPATCH_KEY = "dispatch"
        let instance = null
        cls[FACTORY_KEY] = () => {
            const c = origFact(compOrig.type)
            const ts = directiveInject(NgTStore) as NgTStore
            ts.conifigureStore(store)
            c[STORE_KEY] = ts.store
            c["isTStoreReady"] = ts.store.isReady
            c[DISPATCH_KEY] = ts.store.dispatch
            instance = c;
            return c;
        }
        const origDestory = compOrig.onDestroy
        compOrig["onDestroy"] = () => {
            if (origDestory) {
                origDestory.call(instance)
            }
            instance[STORE_KEY].cleanup()
        }
        return cls;
    }
}