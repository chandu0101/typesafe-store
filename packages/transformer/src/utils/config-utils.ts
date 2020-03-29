import { TypeSafeStoreConfigExtra, TypeSafeStoreConfig, TsBuildInfo } from "../types";
import { resolve, join, dirname, sep } from "path";
import { REDUCERS_FOLDER, GENERATED_FOLDER, STORE_TYPES_FOLDER, REST_API_TYPES_FOLDER, GRAPHQL_API_TYPES_FOLDER, GRAPHQL_QUERIES_FOLDER } from "../constants";
import ts = require("typescript");
import { FileUtils } from "./file-utils";



let config: TypeSafeStoreConfigExtra = null as any
let compilerOptions: ts.CompilerOptions = null as any
let tempBuildInfo: TsBuildInfo | undefined = undefined
/**
 *  typesafe-store config utils
 */
export class ConfigUtils {

    static setConfig(tStoreCnofig: TypeSafeStoreConfig, co: ts.CompilerOptions) {
        compilerOptions = co
        config = {
            ...tStoreCnofig, reducersPath: "", reducersGeneratedPath: "",
            typesPath: "",
            restApiTypesPath: "",
            graphqlApiTypesPath: "",
            graphqlQueriesPath: "",
        };
        config.storePath = resolve(config.storePath)
        config.reducersPath = join(config.storePath, REDUCERS_FOLDER)

        config.reducersGeneratedPath = join(config.reducersPath, GENERATED_FOLDER)

        config.typesPath = join(config.storePath, STORE_TYPES_FOLDER)

        config.restApiTypesPath = join(config.typesPath, REST_API_TYPES_FOLDER)

        config.graphqlApiTypesPath = join(config.typesPath, GRAPHQL_API_TYPES_FOLDER)

        config.graphqlQueriesPath = join(config.storePath, GRAPHQL_QUERIES_FOLDER)

        config.tsBuildInfoPath = ts.getTsBuildInfoEmitOutputFilePath(compilerOptions)
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

    static getBuildInfo(): TsBuildInfo | undefined {
        if (!config.tsBuildInfoPath) {
            return undefined
        }
        let result: TsBuildInfo | undefined = undefined
        try {
            const content = FileUtils.readFileSync(config.tsBuildInfoPath)
            return JSON.parse(content)
        } catch (error) {
            result = undefined
        }
        return result
    }

    static resetTempBuildInfo() {
        tempBuildInfo = this.getBuildInfo()
    }


    static getGraphqlApiNameFromGraphqlQueriesPath(file: string) {
        return file.replace(config.graphqlQueriesPath, "").split(sep)[0]
    }

    static getFileVersion(file: string, reuseBuildInfo?: boolean) {
        let buildInfo: TsBuildInfo | undefined = undefined
        if (reuseBuildInfo) {
            if (!tempBuildInfo) {
                tempBuildInfo = this.getBuildInfo()
            }
            buildInfo = tempBuildInfo
        } else {
            buildInfo = this.getBuildInfo()
        }
        return buildInfo!.program.fileInfos[file].version
    }

}