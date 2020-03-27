import { TypeSafeStoreConfigExtra, TypeSafeStoreConfig } from "../types";
import { resolve, join, dirname, sep } from "path";
import { REDUCERS_FOLDER, GENERATED_FOLDER, STORE_TYPES_FOLDER, REST_API_TYPES_FOLDER, GRAPHQL_API_TYPES_FOLDER, GRAPHQL_QUERIES_FOLDER } from "../constants";



let config: TypeSafeStoreConfigExtra = null as any

/**
 *  typesafe-store config utils
 */
export class ConfigUtils {

    static setConfig(configIn: TypeSafeStoreConfig) {
        config = {
            ...configIn, reducersPath: "", reducersGeneratedPath: "",
            typesPath: "",
            restApiTypesPath: "",
            graphqlApiTypesPath: "",
            graphqlQueriesPath: ""
        };
        config.storePath = resolve(config.storePath)
        config.reducersPath = join(config.storePath, REDUCERS_FOLDER)

        config.reducersGeneratedPath = join(config.reducersPath, GENERATED_FOLDER)

        config.typesPath = join(config.storePath, STORE_TYPES_FOLDER)

        config.restApiTypesPath = join(config.typesPath, REST_API_TYPES_FOLDER)

        config.graphqlApiTypesPath = join(config.typesPath, GRAPHQL_API_TYPES_FOLDER)

        config.graphqlQueriesPath = join(config.storePath, GRAPHQL_QUERIES_FOLDER)
    }

    static getConfig() {
        return config;
    }
    /**
     *  if reducer defined in subfolders of reducers folder then get subfolders path as prefix
     *   (Example : reducers/one/Sample.ts  group = ${PREFIX}/Sample = one/Sample )
     * @param file 
     */
    static getPrefixPathForReducerGroup(file: string) {
        const dir = dirname(file)
        const reducersPath = config.reducersPath
        const result = dir.replace(reducersPath, "").split(sep).join("/")
        return result === "" ? result : `${result}/`
    }

    /**
     * 
     * @param apiName 
     */
    static getOutPutPathForRestApiTypes(apiName: string) {
        return join(config.restApiTypesPath, GENERATED_FOLDER, apiName + ".ts")
    }

}