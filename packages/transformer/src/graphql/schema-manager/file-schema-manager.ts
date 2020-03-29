import { SchemaManager } from "./schema-manager"
import { GraphQLSchema, buildClientSchema, buildSchema } from "graphql"
import { existsSync, promises as fsp } from "fs";
import { parse } from "path"


export class FileSchemaManager extends SchemaManager {

    constructor(public readonly file: string, public readonly tag: string) {
        super(tag)
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