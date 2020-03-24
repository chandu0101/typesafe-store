
import * as ts from "typescript";
import { Decoder, string, object, array, oneOf, constant, optional, anyJson } from "@mojotech/json-type-validation"


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

export enum ContentType {
    APPLICATION_JSON = "application/json",
    APPLICATION_OCTET_STREAM = "application/octet-stream"
}

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


export type GlobalMeta = {
    restApis:,
    reducers: Map<string, ReducersMeta>
}

/**
 * 
 */
export type ReducersMeta = {
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

/**
 *  path : http url path 
 *  method : optional rest api method (GET | POST | PUT | ..), default value = GET
 *  headers : optional http headers 
 *  body : optional http body ,provide it if method is not GET
 */
export type ConfigUrl = {
    path: string, method?: string, headers?: Record<string, string>,
    body?: Record<string, string>
}

/**
 *  name : name of your api
 *  file: path to openApiSepc file .json/.yaml   
 *  url : url to download openApiSpec 
 */
export type RestApiConfig = {
    name: string, file?: string,
    url?: ConfigUrl
}

export type OpenApiSpecFormat = "yaml" | "json"

/**
 *  name : name with which you want to write graphql queries example : gql` query allUsers{ id }` , shopify` query shoppingList{ price}`, github`query allRepos{ name }`
 *  file : path to local schema file 
 *   url : url to get graphql schema 
 */
export type GraphqlApiConfig = {
    name: string, file?: string,
    url?: ConfigUrl
}

/**
 *  storepath : "folderPath" to store.
 *  framework : framework you using in your application. 
 *  restApis : rest apis config.
 *  graphqlApis : graphql apis config.
 */
export type TypeSafeStoreConfig = {
    storePath: string,
    framework: SupportedFrameworks,
    restApis?: RestApiConfig[],
    graphqlApis?: GraphqlApiConfig[]
}

export const typeSafeStoreConfigDecoder: Decoder<TypeSafeStoreConfig> = object({
    storePath: string(),
    framework: oneOf(constant(SupportedFrameworks.REACT),
        constant(SupportedFrameworks.VANILLA),
        constant(SupportedFrameworks.ANGULAR),
        constant(SupportedFrameworks.HAUNTED),
        constant(SupportedFrameworks.LITHTML),
        constant(SupportedFrameworks.IONIC),
        constant(SupportedFrameworks.PREACT),
        constant(SupportedFrameworks.STENCIL),
        constant(SupportedFrameworks.SVELTE),
        constant(SupportedFrameworks.VUE),
        constant(SupportedFrameworks.PREACT),
    ),
    restApis: optional(array(object({
        name: string(),
        file: optional(string()),
        url: optional(object({
            path: string(),
            method: optional(string()),
            headers: optional(anyJson()),
            body: optional(anyJson()),
        }))
    }))),
    graphqlApis: optional(array(object({
        name: string(),
        file: optional(string()),
        url: optional(object({
            path: string(),
            method: optional(string()),
            headers: optional(anyJson()),
            body: optional(anyJson()),
        }))
    }))),
})

export type TypeSafeStoreConfigExtra = {
    storePath: string,
    framework: SupportedFrameworks,
    restApis?: RestApiConfig[],
    reducersPath: string,
    reducersGeneratedPath: string,
    typesPath: string,
    restApiTypesPath: string,
    graphqlApiTypesPath: string
}



