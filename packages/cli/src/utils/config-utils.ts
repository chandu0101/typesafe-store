import { TypeSafeStoreConfigExtra, TypeSafeStoreConfig, TsBuildInfo, GraphqlApiConfig, TypescriptCompilerOptions, TypescriptPlugin, TsGraphqlPluginConfig, RestApiConfig, typeSafeStoreConfigDecoder } from "../types";
import { resolve, join, dirname, sep } from "path";
import { REDUCERS_FOLDER, GENERATED_FOLDER, STORE_TYPES_FOLDER, REST_API_TYPES_FOLDER, GRAPHQL_API_TYPES_FOLDER, GRAPHQL_OPERATIONS_FOLDER, TS_GRAPHQL_PLUGIN_NAME, TYPESAFE_STORE_CONFIG_KEY, GEN_SUFFIX, SELECTORS_FOLDER } from "../constants";
import * as ts from "typescript";
import { FileUtils } from "./file-utils";
import { initializeGraphqlConfig } from "../graphql";
import { generateTypesForRestApiConfig } from "../rest/open-api-import";
import { lstatSync, existsSync } from "fs";
import { MetaUtils } from "./meta-utils";





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
            typesPath: "",
            restApiTypesPath: "",
            graphqlApiTypesPath: "",
            graphqlOperationsPath: "",
            seelctorsPath: "",
            selectorsGeneratedPath: ""
        };
        config.storePath = resolve(config.storePath)
        config.reducersPath = join(config.storePath, REDUCERS_FOLDER)

        config.reducersGeneratedPath = join(config.reducersPath, GENERATED_FOLDER)

        config.seelctorsPath = join(config.seelctorsPath, SELECTORS_FOLDER)

        config.selectorsGeneratedPath = join(config.seelctorsPath, GENERATED_FOLDER)

        config.typesPath = join(config.storePath, STORE_TYPES_FOLDER)

        config.restApiTypesPath = join(config.typesPath, REST_API_TYPES_FOLDER)

        config.graphqlApiTypesPath = join(config.typesPath, GRAPHQL_API_TYPES_FOLDER)

        config.graphqlOperationsPath = join(config.storePath, GRAPHQL_OPERATIONS_FOLDER)

        config.tsBuildInfoPath = ts.getTsBuildInfoEmitOutputFilePath(compilerOptions)
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
    static getOutPutPathForRestApiTypes(apiName: string) {
        return join(this.getConfig().restApiTypesPath, GENERATED_FOLDER, apiName + ".ts")
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
        const res = file.replace(this.getConfig().graphqlOperationsPath, "").split(sep)
        console.log("res", res);
        return res[1]
    }

    static getGraphqlOperationVariableNamePrefix(file: string) {
        let p = file.replace(this.getConfig().graphqlOperationsPath, "").split(sep).slice(2)
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
    static getGraphqlTypesOutputPath(apiName: string) {
        return join(this.getConfig().graphqlApiTypesPath, apiName, "index.ts")
    }

    static isReducersSourceFile(file: string) {
        return this.isTsFile(file) && file.includes(this.getConfig().reducersPath) && !file.includes(this.getConfig().reducersGeneratedPath)
    }

    static isGraphqlOperationsSourceFile(file: string) {
        console.log("file : ", this.getConfig().graphqlOperationsPath);
        return this.isTsFile(file) && file.includes(this.getConfig().graphqlOperationsPath)
    }
    static isSelectorsSourceFile(file: string) {
        return this.isTsFile(file) && file.includes(this.getConfig().seelctorsPath) && !file.includes(this.getConfig().selectorsGeneratedPath)
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



}