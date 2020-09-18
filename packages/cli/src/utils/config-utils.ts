import { TypeSafeStoreConfigExtra, TypeSafeStoreConfig, TsBuildInfo, GraphqlApiConfig, TypescriptCompilerOptions, TypescriptPlugin, TsGraphqlPluginConfig, RestApiConfig, typeSafeStoreConfigDecoder, GrpcApiConfig } from "../types";
import { resolve, join, dirname, sep } from "path";
import { REDUCERS_FOLDER, GENERATED_FOLDER, STORE_TYPES_FOLDER, REST_APIS_FOLDER, GRAPHQL_APIS_FOLDER, GRAPHQL_OPERATIONS_FOLDER, TS_GRAPHQL_PLUGIN_NAME, TYPESAFE_STORE_CONFIG_KEY, GEN_SUFFIX, SELECTORS_FOLDER, WORKERS_FOLDER, GRPC_APIS_FOLDER, GRPC_ENCODERS_DECODERS_FOLDER, APIS_FOLDER_NAME, APIS_TYPES_FOLDER, API_REQUEST_CREATORS_FOLDER } from "../constants";
import * as ts from "typescript";
import { FileUtils } from "./file-utils";
import { initializeGraphqlConfig } from "../graphql";
import { generateTypesForRestApiConfig } from "../rest/open-api-import";
import { lstatSync, existsSync } from "fs";
import { MetaUtils } from "./meta-utils";
import { generateGrpcTypes } from "../grpc";





abstract class ConfigValidation {
    /**
 *  converts ts-graphql-plugin  config to tstore GraphqlApi config 
 * @param tsconfig 
 */
    static getGraphqlApiFromTsGraphqlPlugin(tsconfig: Record<string, any>): GraphqlApiConfig | undefined {
        let result = undefined
        const compilerOptions: TypescriptCompilerOptions = tsconfig["compilerOptions"]
        if (compilerOptions) {
            const plugins: TypescriptPlugin[] = compilerOptions.plugins
            if (plugins && Array.isArray(plugins)) {
                const tsGraphqlPlugin = plugins.find(p => p.name === TS_GRAPHQL_PLUGIN_NAME)
                if (tsGraphqlPlugin) {
                    const gp: TsGraphqlPluginConfig = tsGraphqlPlugin as any;
                    if (gp.schema && gp.tag) {
                        let schemaObject: { file?: string, http?: { url: string, headers?: Record<string, string> } } = {}
                        if (typeof gp.schema === "string") {
                            const path = gp.schema;
                            if (/https?/.test(path)) {
                                schemaObject.http = {
                                    url: path,
                                }
                            } else {
                                schemaObject.file = path
                            }
                        } else {
                            schemaObject = gp.schema as any
                        }
                        if (schemaObject.file && schemaObject.http) {
                            throw new Error("You should provide either schema file or graphql end point not both")
                        }
                        if (schemaObject.file) {
                            result = { file: { path: schemaObject.file, url: "" }, tag: gp.tag, name: TS_GRAPHQL_PLUGIN_NAME }
                        }
                        if (schemaObject.http) {
                            result = { http: { url: schemaObject.http.url, headers: schemaObject.http.headers }, tag: gp.tag, name: TS_GRAPHQL_PLUGIN_NAME }
                        }
                    }
                }
            }
        }

        return result;
    }


    static async isValidGraphqlConfig(tsConfig: Record<string, any>, tstoreGraphqlApis?: GraphqlApiConfig[]) {
        let result: [boolean, string] = [true, ""]
        const graphqlApis: GraphqlApiConfig[] = []
        const tsGraphqPluginCOnfig = this.getGraphqlApiFromTsGraphqlPlugin(tsConfig)
        if (tsGraphqPluginCOnfig) {
            graphqlApis.push(tsGraphqPluginCOnfig)
        }
        if (tstoreGraphqlApis) {
            graphqlApis.push(...tstoreGraphqlApis)
        }
        if (graphqlApis.length > 0) {
            const al = graphqlApis.length
            const sl = [...new Set(graphqlApis.map(ra => ra.name))].length
            if (al !== sl) {
                result = [false, "graphqlApis config names should be unique"]
            } else {
                result = await initializeGraphqlConfig(graphqlApis)
            }
        }
        return result
    }


    static async isValidRestAPisConfig(restApis?: RestApiConfig[]): Promise<[boolean, string]> {
        let result: [boolean, string] = [true, ""]
        if (restApis && restApis.length > 0) {
            const al = restApis.length
            const sl = [...new Set(restApis.map(ra => ra.name))].length
            if (al !== sl) {
                result = [false, "restApis config names should be unique"]
            } else {
                result = await generateTypesForRestApiConfig(restApis)
            }
        }
        return result
    }

    static async isValidGrpcAPisConfig(grpcAPis?: GrpcApiConfig[]): Promise<[boolean, string]> {
        let result: [boolean, string] = [true, ""]
        if (grpcAPis && grpcAPis.length > 0) {
            const al = grpcAPis.length
            const sl = [...new Set(grpcAPis.map(ra => ra.name))].length
            if (al !== sl) {
                result = [false, "grpcAPis config names should be unique"]
            } else {
                result = await generateGrpcTypes(grpcAPis)
            }
        }
        return result
    }

    /**
     * 
     * @param tsConfig 
     */
    static async  isValidConfig(tsConfig: Record<string, any>): Promise<[boolean, string]> {
        let result: [boolean, string] = [true, ""]
        try {
            console.log(`Validating config : `, tsConfig);
            const tStoreObj = tsConfig[TYPESAFE_STORE_CONFIG_KEY]
            if (!tStoreObj) {
                throw new Error("You didn't provided valid typesafe-store config ,please follow the documentation link : TODO ")
            }
            const validJson = typeSafeStoreConfigDecoder.run(tStoreObj)
            if (!validJson.ok) {
                result = [false, `not a valid config : ${JSON.stringify(validJson.error)}`]
            } else {
                const tStoreConfig: TypeSafeStoreConfig = tStoreObj as any
                if (!lstatSync(resolve(tStoreConfig.storePath)).isDirectory()) {
                    result = [false, "you should provide a valid storePath folder"]
                } else {
                    // setStorePath(resolve(tStoreConfig.storePath))
                    ConfigUtils.setConfig(tStoreConfig, tsConfig["compilerOptions"])
                    result = await this.isValidRestAPisConfig(tStoreConfig.restApis)
                    if (result[0]) { // valid restApis config 
                        result = await this.isValidGraphqlConfig(tsConfig, tStoreConfig.graphqlApis)
                        if (result[0]) { //  valid graphqlAPis config
                            result = await this.isValidGrpcAPisConfig(tStoreConfig.grpcApis)
                            if (result[0]) { // valid grpcApis config

                            }
                        }
                    }
                }
            }
        } catch (error) {
            result = [false, error]
        }

        return result;
    }
}

/**
 *  typesafe-store config utils
 */
export class ConfigUtils extends ConfigValidation {

    static setConfig(tStoreCnofig: TypeSafeStoreConfig, co: ts.CompilerOptions) {
        const compilerOptions = co
        const config: TypeSafeStoreConfigExtra = {
            ...tStoreCnofig, reducersPath: "", reducersGeneratedPath: "",
            selectorsPath: "",
            selectorsGeneratedPath: "",
            workersPath: "",
            apisPath: "",
            storeMetaPath: ""
        };
        config.storePath = resolve(config.storePath)
        config.storeMetaPath = resolve('.tstore')
        config.reducersPath = join(config.storePath, REDUCERS_FOLDER)

        config.reducersGeneratedPath = join(config.reducersPath, GENERATED_FOLDER)

        config.selectorsPath = join(config.selectorsPath, SELECTORS_FOLDER)

        config.selectorsGeneratedPath = join(config.selectorsPath, GENERATED_FOLDER)
        config.apisPath = join(config.storePath, APIS_FOLDER_NAME)
        config.workersPath = resolve("workers")

        //TODO looks like it doesnt exist on older versions of typescript
        // config.tsBuildInfoPath = ts.getTsBuildInfoEmitOutputFilePath(compilerOptions) 
        console.log("config obj : ", config);
        MetaUtils.setConfig(config)
    }

    static getConfig() {
        return MetaUtils.getConfig();
    }
    /**
     *  if reducer defined in subfolders of reducers folder then get subfolders path as prefix
     *   (Example : reducers/one/Sample.ts  group = ${PREFIX}/Sample = one/Sample )
     * @param file 
     */
    static getPrefixPathForReducerGroup(file: string) {
        const dir = dirname(file)
        const reducersPath = this.getConfig().reducersPath
        const result = dir.replace(reducersPath, "").split(sep).join("/")
        return result === "" ? result : `${result}/`
    }

    /**
     * 
     * @param apiName 
     */
    static getRestApiOutputFilePathForTypes(apiName: string) {
        return join(this.getConfig().apisPath, REST_APIS_FOLDER, apiName, APIS_TYPES_FOLDER, "index.ts")
    }

    static getRestApiOutputFilePathForRequestCreators(apiName: string) {
        return join(this.getConfig().apisPath, REST_APIS_FOLDER, apiName, API_REQUEST_CREATORS_FOLDER, "index.ts")
    }
    static getRestApiOutputFolderPathForTypes(apiName: string) {
        return join(this.getConfig().apisPath, REST_APIS_FOLDER, apiName, APIS_TYPES_FOLDER)
    }

    static getGrpcApiOutputFilePathForTypes(apiName: string) {
        return join(this.getConfig().apisPath, GRPC_APIS_FOLDER, apiName, APIS_TYPES_FOLDER, "index.ts")
    }

    static getGrpcApiOutputFilePathForRequestCreators(apiName: string) {
        return join(this.getConfig().apisPath, GRPC_APIS_FOLDER, apiName, API_REQUEST_CREATORS_FOLDER, "index.ts")
    }

    static getGrpcApiOutputFolderForTypes(apiName: string) {
        return join(this.getConfig().apisPath, GRPC_APIS_FOLDER, apiName, APIS_TYPES_FOLDER)
    }

    static getGrpcOutputFilePathForSerializersTypes(apiName: string) {
        return join(this.getConfig().apisPath, GRPC_APIS_FOLDER, apiName, GRPC_ENCODERS_DECODERS_FOLDER, "index.ts")
    }

    static getGrpcOutputFolderForSerializersTypes(apiName: string) {
        return join(this.getConfig().apisPath, GRPC_APIS_FOLDER, apiName, GRPC_ENCODERS_DECODERS_FOLDER)
    }

    static getBuildInfo(): TsBuildInfo | undefined {
        if (!this.getConfig().tsBuildInfoPath) {
            return undefined
        }
        let result: TsBuildInfo | undefined = undefined
        try {
            const content = FileUtils.readFileSync(this.getConfig().tsBuildInfoPath!)
            return JSON.parse(content)
        } catch (error) {
            result = undefined
        }
        return result
    }

    static resetTempBuildInfo() {
        const bi = this.getBuildInfo()
        if (bi) {
            MetaUtils.setTempTsBuildInfo(bi)
        }
        return bi;
    }

    static getTempBuildInfo() {
        return MetaUtils.getTempTsBuildInfo()
    }

    static getGraphqlApiNameFromGraphqlOperationsPath(file: string) {
        const res = file.replace(this.getGraphqlApisFolder(), "").split(sep)
        console.log("res", res);
        return res[1]
    }

    static getGraphqlOperationVariableNamePrefix(file: string) {
        let p = file.replace(this.getGraphqlApisFolder(), "").split(sep).slice(3)
        const f = p[0]
        if (f === "queries" || f === "mutations" || f === "subscriptions") {
            p = p.slice(1)
        }
        console.log("P", p);
        if (p.length === 1) {
            return p[0].replace(".ts", "")
        } else {
            p.pop()
            return p.join("_")
        }
    }

    static getFileVersion(file: string, reuseBuildInfo?: boolean) {
        let buildInfo: TsBuildInfo | undefined = undefined
        if (reuseBuildInfo) {
            const tBI = this.getTempBuildInfo()
            buildInfo = tBI
            if (!tBI) {
                buildInfo = this.resetTempBuildInfo()
            }

        } else {
            buildInfo = this.getBuildInfo()
        }
        return buildInfo!.program.fileInfos[file].version
    }

    static isTsBuildInfoExist() {
        const path = this.getConfig().tsBuildInfoPath
        return path && existsSync(path)
    }

    private static isTsFile(file: string) {
        return file.endsWith(".ts")
    }
    static getGraphqlOutputPathForTypes(apiName: string) {
        return join(this.getConfig().apisPath, GRAPHQL_APIS_FOLDER, apiName, APIS_TYPES_FOLDER, "index.ts")
    }

    static getGraphqlOutputPathForlRequestCreators(apiName: string) {
        return join(this.getConfig().apisPath, GRAPHQL_APIS_FOLDER, apiName, API_REQUEST_CREATORS_FOLDER, "index.ts")
    }

    static getGraphqlOutputFolderForTypes(apiName: string) {
        return join(this.getConfig().apisPath, GRAPHQL_APIS_FOLDER, apiName, APIS_TYPES_FOLDER)
    }
    static getGraphqlOutputFolderForOperations(apiName: string) {
        return join(this.getConfig().apisPath, GRAPHQL_APIS_FOLDER, apiName, GRAPHQL_OPERATIONS_FOLDER)
    }

    static getGraphqlOutputFolderForRequestCreators(apiName: string) {
        return join(this.getConfig().apisPath, GRAPHQL_APIS_FOLDER, apiName, API_REQUEST_CREATORS_FOLDER)
    }

    static getGraphqlApisFolder() {
        return join(this.getConfig().apisPath, GRAPHQL_APIS_FOLDER)
    }
    static getGraphqlOutputPathForTagFunction(apiName: string, tag: string) {
        return join(this.getConfig().apisPath, GRAPHQL_APIS_FOLDER, apiName, `${tag}.ts`)
    }
    static isReducersSourceFile(file: string) {
        const config = this.getConfig()
        const rtype = join(config.reducersPath, "types")
        const thelers = join(config.reducersPath, "helpers")
        return this.isTsFile(file) && file.includes(config.reducersPath)
            && !file.includes(config.reducersGeneratedPath) && !file.includes(rtype) && !file.includes(thelers)
    }

    static isGraphqlOperationsSourceFile(file: string) {
        const graphqlApis = this.getGraphqlApisFolder()
        if (this.isTsFile(file) && file.includes(graphqlApis)) {
            const restPath = file.replace(graphqlApis, "").slice(1)
            const r = /\w+\/operations/i
            return !!restPath.match(r)
        }
        return false
    }
    static isSelectorsSourceFile(file: string) {
        const config = this.getConfig()
        const stype = join(config.selectorsPath, "types")
        const shelepers = join(config.selectorsPath, "helpers")
        return this.isTsFile(file) && file.includes(config.selectorsPath)
            && !file.includes(config.selectorsGeneratedPath) && !file.includes(stype) && !file.includes(shelepers)
    }

    static getOutputPathForReducerSourceFile(file: string) {
        const reducers = `${sep}${REDUCERS_FOLDER}${sep}`
        const genReducers = `${reducers}${GENERATED_FOLDER}${sep}`
        return file.replace(reducers, genReducers).replace(".ts", `${GEN_SUFFIX}.ts`)
    }

    static getOutputPathForSelectorSourceFile(file: string) {
        const selectors = `${sep}${SELECTORS_FOLDER}${sep}`
        const genSelectors = `${selectors}${GENERATED_FOLDER}${sep}`
        return file.replace(selectors, genSelectors).replace(".ts", `${GEN_SUFFIX}.ts`)
    }

    static getOutputPathForWorkers() {
        return join(this.getConfig().workersPath, "worker.ts")
    }

    static isPathReducersSourcePath(file: string) {
        const config = this.getConfig()
        return file.includes(config.reducersPath) && !file.includes(config.reducersGeneratedPath)
    }

    static getPeristMode() {
        return this.getConfig().persistMode
    }

    static getWorkerFunctionsMetaFilePath() {
        const config = this.getConfig()
        return join(config.storeMetaPath, "workers-functions.json")
    }

}