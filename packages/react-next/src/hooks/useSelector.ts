import React, { useContext, useCallback } from "react"
import { Selector, UnsubscribeOptions, TypeSafeStore } from "@typesafe-store/store"
import { TypeSafeStoreContext } from "../context"



export default function useSelector<S, R>(selector: Selector<S, R>, options?: UnsubscribeOptions): R {
    const mutableSource = useContext(TypeSafeStoreContext)
    const getSnapShot = React.useCallback((store: TypeSafeStore<any>) => {
        return selector.fn(store.state)
    }, [selector])
    const subscribe = useCallback((store: TypeSafeStore<any>, callback: any) => {
        const us = store.subscribeSelector(selector, callback)
        return () => {
            us(options)
        }
    }, [selector])
    return (React as any).useMutableSource(mutableSource, getSnapShot, subscribe)
}
