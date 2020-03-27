import { GraphqlApiConfig, HttpUrlConfig, ContentType } from "./types";
import { GraphQLSchema, buildClientSchema, buildSchema } from "graphql"
import { introspectionQuery } from "graphql/utilities"
import { existsSync, promises as fsp } from "fs";
import { parse } from "path";


const INTRO_SPECTION_QUERY = { query: introspectionQuery }

const schemaMeta: Map<string, SchemaManager> = new Map()

abstract class SchemaManager {
    schema?: GraphQLSchema
    error?: string
    abstract readSchema(): Promise<void>
}

class FileSchemaManager extends SchemaManager {

    constructor(public file: string) {
        super()
    }

    private _schema?: GraphQLSchema

    private _error?: string

    get schema() {
        return this._schema
    }

    get error() {
        return this._error
    }

    async readSchema() {
        try {
            const { ext } = parse(this.file)
            if (!existsSync(this.file) && !(ext === ".json" || ext === ".graphql" || ext === ".gql")) {
                this._error = `you should provide a valid graphqlSchema file with extension .json/.graphql/.gql`
            } else {
                const content = await fsp.readFile(this.file, { encoding: "utf-8" })
                if (ext === ".json") {
                    let json = JSON.parse(content)
                    if (json.data) {
                        json = json.data
                    }
                    this._schema = buildClientSchema(json)
                } else {
                    this._schema = buildSchema(content)
                }
            }
        } catch (error) {
            this._error = `Error while reading file : ${this.file} , ${error}`
        }
    }

}

class HttpSchemaManager extends SchemaManager {

    constructor(public http: HttpUrlConfig) {
        super()
    }

    private _schema?: GraphQLSchema
    private _error?: string

    get schema() {
        return this._schema
    }

    get error() {
        return this._error
    }

    async readSchema() {
        const options: RequestInit = { method: "POST", headers: { "Content-Type": ContentType.APPLICATION_JSON } }
        try {
            if (this.http.method) {
                options.method = this.http.method;
            }
            if (this.http.headers) {
                options.headers = { ...options.headers, ...this.http.headers }
            }

            options.body = JSON.stringify(INTRO_SPECTION_QUERY)

            const resp = await fetch(this.http.url, options)

            if (!resp.ok) {
                this._error = `Request to ${this.http.url} failed with error : ${resp.statusText}`
            } else {
                const json = await resp.json()
                this._schema = buildSchema(json.data)
            }

        } catch (error) {
            this._error = `Error while trying to get schema from url ${this.http.url} : ${error}`
        }
    }

}



/**
 *  
 */
export async function generateTypesForGraphqlQueriesInApp(graphqlApis: GraphqlApiConfig[]): Promise<[boolean, string]> {
    let result: [boolean, string] = [true, ""]
    await Promise.all(graphqlApis.map(async (gApi) => {
        if (!gApi.file && !gApi.http) {
            throw new Error(`graphqlAPis config  ${gApi.name} : you should provide either file or url.`)
        }
        if (gApi.file && gApi.http) {
            throw new Error(`graphqlAPis config  ${gApi.name} : you should provide either file or url not both.`)
        }
        let schemaManager: SchemaManager = null as any
        if (gApi.file) {
            schemaManager = new FileSchemaManager(gApi.file)
        } else {
            schemaManager = new HttpSchemaManager(gApi.http!)
        }
        await schemaManager.readSchema()
        if (schemaManager.error) {
            throw new Error(schemaManager.error)
        }
        schemaMeta.set(gApi.name, schemaManager)

    }))

    return result;
}

