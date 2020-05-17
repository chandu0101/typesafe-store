import React, { useContext, useCallback } from "react"
import { Selector, UnsubscribeOptions, TypeSafeStore } from "@typesafe-store/store"
import { TypeSafeStoreContext } from "../context"


type MakeDataDefined<T extends { data?: any }> = T & { data: NonNullable<T["data"]> }


type SuspenseSupportedType<D, E> = { data?: D, loading?: boolean, error?: E }

export default function useSelectorSupspense<R extends SuspenseSupportedType<any, any>, S>(selector: Selector<S, R>, options?: UnsubscribeOptions): MakeDataDefined<R> {
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
    const v = (React as any).useMutableSource(mutableSource, getSnapShot, subscribe)
    if (v.data) {
        return v;
    } else if (v.error) {
        throw v.error
    } else {
        throw new Promise(resolve => {
        })
    }

}
