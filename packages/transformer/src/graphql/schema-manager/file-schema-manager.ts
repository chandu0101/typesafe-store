import { SchemaManager } from "./schema-manager"
import { GraphQLSchema, buildClientSchema, buildSchema } from "graphql"
import { existsSync, promises as fsp } from "fs";
import { parse } from "path"
import { GraphqlApiConfig } from "../../types";
import { FileUtils } from "../../utils/file-utils";


export class FileSchemaManager extends SchemaManager {

    constructor(public readonly file: { path: string, url: string }, public readonly tag: string) {
        super(tag, file.url)
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
            const { ext } = parse(this.file.path)
            if (!existsSync(this.file.path) && !(ext === ".json" || ext === ".graphql" || ext === ".gql")) {
                this._error = `you should provide a valid graphqlSchema file with extension .json/.graphql/.gql`
            } else {
                const content = await FileUtils.readFile(this.file.path)
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