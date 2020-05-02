import { useDispatch } from "@typesafe-store/react"
import { Dispatch } from "@typesafe-store/store"
import { AppAction } from "../store"



const useAppDispatch = (): Dispatch<AppAction> => {
    const dispatch = useDispatch()
    return dispatch
}

export default useAppDispatch