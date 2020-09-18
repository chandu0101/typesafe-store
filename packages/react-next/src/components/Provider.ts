
//@ts-ignore
import { ReducerGroup, TypeSafeStore } from "@typesafe-store/store"
import React from "react"
import { TypeSafeStoreContext, TypeSafeStoreContextType } from "../context"

/**
 *  store: typesafe store 
 *  loadingComponent : loading component used when you're passing store with persitant storage
 */
type ProviderProps<R extends Record<string, ReducerGroup<any, any, any, any>>> = {
    store: TypeSafeStore<R>,
    children: React.ReactNode,
    loadingComponent?: React.ReactNode
}

function getStoreVersion(store: TypeSafeStore<any>) {
    return store.state
}

export default function Provider<R extends Record<string, ReducerGroup<any, any, any, any>>>({ store, children, loadingComponent }: ProviderProps<R>) {

    const [loading, setLoading] = React.useState(!store.isReady)
    const mutableSource = React.useMemo(() => {
        return (React as any).createMutableSource(store, getStoreVersion)
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
            mutableSource._source.cleanup()
        }
    }, [store])

    const props = { value: mutableSource }
    const c = loading ? loadingComponent : children
    return React.createElement(TypeSafeStoreContext.Provider, props, c)
}
