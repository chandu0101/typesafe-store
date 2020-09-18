
//@ts-ignore
import { ReducerGroup, TypeSafeStore } from "@typesafe-store/store"
import React from "react"
import { TypeSafeStoreContext, TypeSafeStoreContextType } from "../context"
import { Subscription } from "../subscription"

/**
 *  store: typesafe store 
 *  loadingComponent : loading component used when you're passing store with persitant storage
 */
type ProviderProps<R extends Record<string, ReducerGroup<any, any, any, any>>> = {
    store: TypeSafeStore<R>,
    children: React.ReactNode,
    loadingComponent?: React.ReactNode
}


export default function Provider<R extends Record<string, ReducerGroup<any, any, any, any>>>({ store, children, loadingComponent }: ProviderProps<R>) {

    const [loading, setLoading] = React.useState(!store.isReady)

    const contextValue = React.useMemo<TypeSafeStoreContextType<R>>(() => {
        const subscription = new Subscription(store)
        return { store, subscription }
    }, [store])

    React.useEffect(() => {
        if (!store.isReady) {
            store._onStoreReadyCallback = () => {
                setLoading(false)
            }
        }
    }, [])

    React.useEffect(() => {
        return () => {
            contextValue.subscription.tryUnSubscribe()
            contextValue.store.cleanup()
        }
    }, [store])

    const props = { value: contextValue }
    const c = loading ? loadingComponent : children
    return React.createElement(TypeSafeStoreContext.Provider, props, c)
}
