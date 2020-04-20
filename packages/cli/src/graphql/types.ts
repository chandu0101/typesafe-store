import { SchemaManager } from "./schema-manager/schema-manager"
import * as ts from "typescript"


export type ResolveError = { message: string, }

export type ResultOfProcessedGqlNode = { gqlText: string, error?: string }

export type NodeResultCacheValue = { gqlText: string, dependencyVersions: { fileName: string, version: string }[] }

export type OperationValue = { text: string, isMultipleOp: boolean, name: string, requestCreator: string }

export type GraphqlApiMeta = {
    schemaManager: SchemaManager, resultCache: Map<ts.Node, NodeResultCacheValue>,
    spanNodeCache: Map<ts.Node, NodeResultCacheValue>,
    operations: {
        queries: Record<string, OperationValue[]>, mutations: Record<string, OperationValue[]>,
        subscriptions: Record<string, OperationValue[]>
    }
}

export const enum GraphqlOperation {
    QUERY = "query",
    MUTATION = "mutation",
    SUBSCRIPTION = "subscription"
}