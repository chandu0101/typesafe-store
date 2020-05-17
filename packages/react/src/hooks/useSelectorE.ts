// import { SelectorE, UnsubscribeOptions } from "@typesafe-store/store"
// import React from "react"
// import { TypeSafeStoreContext } from "../context"
// import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect.native"

// type UseSelectorEOptions = { resetStateOnUnsubscribe?: boolean }

// export default function useSelectorE<S, E, R>(selector: SelectorE<S, E, R>, extInput: E, options?: UseSelectorEOptions): R {

//     const forceUpdate = React.useReducer(() => ({}), {})[1] as () => void

//     const context = React.useContext(TypeSafeStoreContext)

//     const unSubscribeListener = React.useMemo<(options?: UnsubscribeOptions) => any>(() => {
//         const listener = () => {
//             selectedStateRef.current = selector.fne(context.store.state, extInput)
//             forceUpdate()
//         }
//         const unsubscribeListener = context.subscription.listenSelector(selector, listener)
//         return unsubscribeListener
//     }, [context, selector])


//     const selectedStateRef = React.useRef<R>()
//     const latestSelectorRef = React.useRef<SelectorE<S, E, R>>()
//     const selectorExtInputRef = React.useRef<E>()

//     if (latestSelectorRef.current !== selector || selectorExtInputRef.current !== extInput) {
//         latestSelectorRef.current = selector
//         selectorExtInputRef.current = extInput
//         selectedStateRef.current = selector.fne(context.store.state, extInput)
//     }

//     useIsomorphicLayoutEffect(() => {

//         return () => {

//             unSubscribeListener({ resetToDefault: options && options.resetStateOnUnsubscribe })
//         }
//     }, [unSubscribeListener])

//     return selectedStateRef.current!;
// }