import * as React from "react"
import { TypeSafeStore, ReducerGroup, Selector, Action, GetStateFromReducers, UnsubscribeOptions } from "@typesafe-store/store"
import { TypeSafeStoreContext } from "../context"
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect"

export type UseSelectorOptions<S, R> = { selector: Selector<S, R>, resetStateOnUnsubscribe?: boolean }


export default function useSelector<S, R>({ selector, resetStateOnUnsubscribe }: UseSelectorOptions<S, R>): R {

    const forceUpdate = React.useReducer(() => ({}), {})[1] as () => void

    const context = React.useContext(TypeSafeStoreContext)

    const unSubscribeListener = React.useMemo<(options?: UnsubscribeOptions) => any>(() => {
        const listener = () => {
            selectedStateRef.current = selector.fn(context.store.state)
            forceUpdate()
        }
        const unsubscribeListener = context.subscription.listenSelector(selector, listener, "")
        return unsubscribeListener
    }, [context, selector])


    const selectedStateRef = React.useRef<R>()
    const latestSelectorRef = React.useRef<Selector<S, R>>()

    if (latestSelectorRef.current !== selector) {
        latestSelectorRef.current = selector
        selectedStateRef.current = selector.fn(context.store.state)
    }

    // useIsomorphicLayoutEffect(() => {
    //   latestSelectorRef.current = selector
    // })

    useIsomorphicLayoutEffect(() => {

        return () => {
            unSubscribeListener({ resetToDefault: resetStateOnUnsubscribe })
        }
    }, [unSubscribeListener])

    return selectedStateRef.current!;
}
