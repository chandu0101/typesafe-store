import React from "react"
import { Selector, UnsubscribeOptions } from "@typesafe-store/store"
import { TypeSafeStoreContext } from "../context"
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect"


export default function useSelector<S, R>(selector: Selector<S, R>, options?: UnsubscribeOptions): R {

    const forceUpdate = React.useReducer(() => ({}), {})[1] as () => void

    const context = React.useContext(TypeSafeStoreContext)

    const unSubscribeListener = React.useMemo<(options?: UnsubscribeOptions) => any>(() => {
        console.log("Listening to store");
        const listener = () => {
            selectedStateRef.current = selector.fn(context.store.state)
            forceUpdate()
        }
        const unsubscribeListener = context.store.subscribeSelector(selector, listener)
        return unsubscribeListener
    }, [context, selector])


    const selectedStateRef = React.useRef<R>()
    const latestSelectorRef = React.useRef<Selector<S, R>>()

    if (latestSelectorRef.current !== selector) {
        latestSelectorRef.current = selector
        selectedStateRef.current = selector.fn(context.store.state)
    }

    useIsomorphicLayoutEffect(() => {

        return () => {
            unSubscribeListener(options)
        }
    }, [unSubscribeListener])

    return selectedStateRef.current!;
}
