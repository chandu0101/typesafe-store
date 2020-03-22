
import * as ts from "typescript";
import { Decoder, string, object, array, oneOf, constant, optional } from "@mojotech/json-type-validation"


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

/**
 *  name : name of your api
 *  openApiSpec: path to openApiSepc file 
 */
export type RestApiConfig = { name: string, openApiSpec: string }

/**
 *  name : name with which you want to write graphql queries example : gql` query allUsers{ id }` , shopify` query shoppingList{ price}`, github`query allRepos{ name }`
 *  schema : url or local path to graphql schema file.
 */
export type GraphqlApiConfig = { name: string, schema: string }

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
    restApis: optional(array(object({ name: string(), openApiSpec: string() }))),
    graphqlApis: optional(array(object({ name: string(), schema: string() }))),
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



