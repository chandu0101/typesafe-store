import { GraphQLSchema } from "graphql"

export abstract class SchemaManager {
    constructor(public readonly tag: string) {

    }
    schema?: GraphQLSchema
    error?: string
    abstract readSchema(): Promise<void>
}