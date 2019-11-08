import { transformer } from "./transformer"
import { GetActionTypes, NonFunctionProperties } from "@typesafe-store/reducer"


export declare function getReducer<T, G extends string>(typeName?: string): (state: NonFunctionProperties<T> | undefined,
    actions: GetActionTypes<T, G>) => NonFunctionProperties<T>


export default transformer;
