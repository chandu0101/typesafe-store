
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

    const [loading, setLoading] = React.useState(!!store.storage)

    const contextValue = React.useMemo<TypeSafeStoreContextType<R>>(() => {
        const subscription = new Subscription(store)
        return { store, subscription }
    }, [store])

    React.useEffect(() => {
        if (store.storage) {
            setInterval(() => {
                if (store.isReady) {
                    clearInterval()
                    setLoading(false)
                }
            }, 1000)
        }
        return () => {
            clearInterval()
        }
    }, [])

    React.useEffect(() => {
        return () => {
            contextValue.subscription.tryUnSubscribe()
        }
    }, [store])

    const props = { value: contextValue }
    return loading ? React.createElement(TypeSafeStoreContext.Provider, props, loadingComponent) : React.createElement(TypeSafeStoreContext.Provider, props, children)
}
