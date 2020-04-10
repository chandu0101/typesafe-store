import * as React from "react"
import { Selector, UnsubscribeOptions } from "@typesafe-store/store"
import { TypeSafeStoreContext } from "../context"
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect"

export type UseSelectorOptions<S, E, R> = { selector: Selector<S, E, R>, extInput: E, resetStateOnUnsubscribe?: boolean }


export default function useSelector<S, E, R>({ selector, resetStateOnUnsubscribe, extInput }: UseSelectorOptions<S, E, R>): R {

    const forceUpdate = React.useReducer(() => ({}), {})[1] as () => void

    const context = React.useContext(TypeSafeStoreContext)

    const unSubscribeListener = React.useMemo<(options?: UnsubscribeOptions) => any>(() => {
        const listener = () => {
            selectedStateRef.current = selector.fn(context.store.state, extInput)
            forceUpdate()
        }
        const unsubscribeListener = context.subscription.listenSelector(selector, listener, "")
        return unsubscribeListener
    }, [context, selector])


    const selectedStateRef = React.useRef<R>()
    const latestSelectorRef = React.useRef<Selector<S, E, R>>()
    const selectorExtInputRef = React.useRef<E>()

    if (latestSelectorRef.current !== selector || selectorExtInputRef.current !== extInput) {
        latestSelectorRef.current = selector
        selectorExtInputRef.current = extInput
        selectedStateRef.current = selector.fn(context.store.state, extInput)
    }

    useIsomorphicLayoutEffect(() => {

        return () => {
            unSubscribeListener({ resetToDefault: resetStateOnUnsubscribe })
        }
    }, [unSubscribeListener])

    return selectedStateRef.current!;
}
