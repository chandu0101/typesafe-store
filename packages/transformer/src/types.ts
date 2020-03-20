
import * as ts from "typescript";
import { TYPESAFE_STORE_CONFIG_STORE_PATH_KEY, TYPESAFE_STORE_CONFIG_FRAMEWORK_KEY } from "./constants";

export type LocalPropertyDecls = {
    pd: ts.PropertyDeclaration;
    type: ts.Type;
    typeStr: string;
};

export type Meta = {
    isOptional?: boolean;
    type: MetaType;
    access?: EAccess[];
};

export type EAccess = {
    name: string;
    type: MetaType;
    exp: ts.Expression;
    isOptional?: boolean;
};

export type MetaValue = { name: string; meta: Meta };
export type ProcessThisResult = { g: string; v: string; values: MetaValue[] };

export const enum MetaType {
    OBJECT,
    ARRAY,
    UNKNOWN,
    SET,
    MAP
}

/**
 * 
 */
export type GlobalInMemory = {
    path: string,
    fullPath: string,
    group: string,
    asyncActions: { name: string, type: string }[]
}


export type CallStatement = { group: string; exp: string; args: string };

export type AssignStatement = {
    group: string;
    exprLeft: string;
    exprRight: string;
    op: string;
};

export type GS = CallStatement | AssignStatement | string;

export type NewValue = { name: string; op: string; value: string };



export type TypeSafeStoreConfig = {
    [TYPESAFE_STORE_CONFIG_STORE_PATH_KEY]: string,
    [TYPESAFE_STORE_CONFIG_FRAMEWORK_KEY]: SupportedFrameworks,
    reducersPath: string,
    reducersGeneratedPath: string
}




// enums 

export enum SupportedFrameworks {
    REACT = "react",
    VANILLA = "vanilla",
    LITHTML = "lit-html",
    ANGULAR = "angular",
    VUE = "vue",
    IONIC = "ionic",
    SVELTE = "svelte",
    HAUNTED = "haunted",
    PREACT = "preact",
    STENCIL = "stencil"
}

export enum AsyncTypes {
    PROMISE = "Promise",
    FETCH = "Fetch",
    FETCH_POST = "FetchPost",
    FETCH_PUT = "FetchPut",
    FETCH_DELETE = "FetchDelete",
    FETCH_PATCH = "FetchPatch",
    GRAPHQL_QUERY = "GraphqlQuery",
    GRAPHQL_MUTATION = "GraphqlMutation",
    GRAPHQL_SUBSCRIPTION = "GraphqlSubscription"
}
