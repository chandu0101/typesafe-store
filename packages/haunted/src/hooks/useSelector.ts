import { useContext, useCallback, useReducer, useMemo, useRef } from "haunted"
import { Selector, UnsubscribeOptions, TypeSafeStore } from "@typesafe-store/store"
import { TypeSafeStoreContext } from "../context"
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect"



export default function useSelector<S, R>(selector: Selector<S, R>, options?: UnsubscribeOptions): R {
    const store = useContext(TypeSafeStoreContext)

    const forceUpdate = useReducer(() => ({}), {})[1] as () => void

    const unSubscribeListener = useMemo<(options?: UnsubscribeOptions) => any>(() => {
        console.log("Listening to store");
        const listener = () => {
            selectedStateRef.current = selector.fn(store.state)
            forceUpdate()
        }
        const unsubscribeListener = store.subscribeSelector(selector, listener)
        return unsubscribeListener
    }, [store, selector])


    const selectedStateRef = useRef<R>(null)
    const latestSelectorRef = useRef<Selector<S, R>>(null)

    if (latestSelectorRef.current !== selector) {
        latestSelectorRef.current = selector
        selectedStateRef.current = selector.fn(store.state)
    }

    useIsomorphicLayoutEffect(() => {

        return () => {
            unSubscribeListener(options)
        }
    }, [unSubscribeListener])

    return selectedStateRef.current!;
}
