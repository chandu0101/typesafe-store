import { useDispatch } from "@typesafe-store/react";
import { Dispatch } from "@typesafe-store/store";
import { AppAction } from "../store";


//TODO put type def at useDisPatch level
export function useAppDispatch(): Dispatch<AppAction> {
    const dispatch = useDispatch()
    return dispatch
}