
import * as ts from "typescript";
import { Decoder, string, object, array, oneOf, constant, optional, anyJson } from "@mojotech/json-type-validation"
import { GraphqlApiMeta } from "./graphql/types";


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

/**
 *  isOptionalAccess meaning this.obj!.s = value
 */
export type Meta = {
    isOptionalAccess?: boolean;
    isTypeOptional?: boolean,
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
export type ProcessThisResult = { group: string; value: string; values: MetaValue[] };

export const enum MetaType {
    OBJECT,
    ARRAY,
    UNKNOWN,
    SET,
    MAP,
    STRING,
    NUMBER
}

export type WorkerFunction = { name: string, group: string, code: string }

export type WorkersMeta = { fns: WorkerFunction[], isChanged: boolean }

export type GlobalMeta = {
    restApis: Map<string, GraphqlApiMeta>,
    graphqlApis: Map<string, GraphqlApiMeta>,
    reducers: Map<string, ReducersMeta>,
    config: TypeSafeStoreConfigExtra,
    program: ts.Program,
    tempBuildInfo?: TsBuildInfo,
    workersMeta: WorkersMeta
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
export type HttpUrlConfig = {
    url: string, method?: string, headers?: Record<string, string>,
    body?: Record<string, string>
}

/**
 *  name : name of your api
 *  file: path to openApiSepc file .json/.yaml   
 *  url : url to download openApiSpec 
 */
export type RestApiConfig = {
    name: string, file?: string,
    http?: HttpUrlConfig
}

export type OpenApiSpecFormat = "yaml" | "json"

/**
 *  name : name with which you want to write graphql queries example : gql` query allUsers{ id }` , shopify` query shoppingList{ price}`, github`query allRepos{ name }`
 *  file : path to local schema file 
 *   url : url to get graphql schema 
 */
export type GraphqlApiConfig = {
    name: string, file?: { path: string, url: string },
    tag: string,
    http?: HttpUrlConfig
}

export type GrpcApiConfig = {
    name: string,
    proto: string,
    url: string,
}

/**
 *  storepath : "folderPath" to store.
 *  framework : framework you using in your application. 
 *  restApis : rest apis config.
 *  graphqlApis : graphql apis config.
 */
export type TypeSafeStoreConfig = {
    storePath: string,
    restApis?: RestApiConfig[],
    graphqlApis?: GraphqlApiConfig[],
    grpcApis?: GrpcApiConfig[],
    persistMode?: "epxlicitPersist" | "explicitDontPersist"
}


export const typeSafeStoreConfigDecoder: Decoder<TypeSafeStoreConfig> = object({
    storePath: string(),
    persistMode: optional(oneOf(constant("epxlicitPersist"),
        constant("explicitDontPersist"))),
    restApis: optional(array(object({
        name: string(),
        file: optional(string()),
        http: optional(object({
            url: string(),
            method: optional(string()),
            headers: optional(anyJson()),
            body: optional(anyJson()),
        }))
    }))),
    graphqlApis: optional(array(object({
        name: string(),
        tag: string(),
        file: optional(object({ path: string(), url: string() })),
        http: optional(object({
            url: string(),
            method: optional(string()),
            headers: optional(anyJson()),
            body: optional(anyJson()),
        }))
    }))),
    grpcApis: optional(array(object({
        name: string(),
        proto: string(),
        url: string()
    }))),
})

export type TypeSafeStoreConfigExtra = TypeSafeStoreConfig & {
    reducersPath: string,
    apisPath: string,
    reducersGeneratedPath: string,
    workersPath: string,
    selectorsPath: string,
    selectorsGeneratedPath: string,
    storeMetaPath: string,
    tsBuildInfoPath?: string
}


/**
 *  Users can also define graphq endpoints in https://github.com/Quramy/ts-graphql-plugin
 */
export type TsGraphqlPluginConfig = {
    name: string, schema: TsGraphqlPluginSchemaConfig,
    tag: string
}

export type TsGraphqlPluginSchemaConfig = string | { file: { path: string } }
    | { http: { url: string, headers?: Record<string, string> } }



export type TypescriptCompilerOptions = { plugins: TypescriptPlugin[] }

export type TypescriptPlugin = { name: string, }


/**
 * 
 */
export type TsBuildInfo = {
    program: { fileInfos: Record<string, { version: string, signature: string }> }
}


export type BooleanStringTuple = [boolean, string]

