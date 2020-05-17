
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

    console.log("Rendering Provider :", store);
    const [loading, setLoading] = React.useState(!!store.storage)

    const memoizedStore = React.useMemo<any>(() => {
        return store
    }, [store])
    console.log("memoized store ", memoizedStore);
    console.log("Store instance comparision : ", memoizedStore === store);
    const contextValue = React.useMemo<TypeSafeStoreContextType<R>>(() => {
        console.log("Re calculating context in provider");
        const subscription = new Subscription(store)
        return { store, subscription }
    }, [store])

    React.useEffect(() => {
        console.log("Provider Mounted .......");
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
            contextValue.store.cleanup()
        }
    }, [store])

    const props = { value: contextValue }
    return loading ? React.createElement(TypeSafeStoreContext.Provider, props, loadingComponent) : React.createElement(TypeSafeStoreContext.Provider, props, children)
}
