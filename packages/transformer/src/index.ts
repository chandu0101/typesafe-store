import * as fs from "fs";
import * as ts from "typescript";
import { typeSafeStoreConfigDecoder, TypeSafeStoreConfig, RestApiConfig, GraphqlApiConfig, TypescriptCompilerOptions, TypescriptPlugin, TsGraphqlPluginConfig } from "./types";
import { TYPESAFE_STORE_CONFIG_KEY, TS_GRAPHQL_PLUGIN_NAME } from "./constants";
import { resolve } from "path";
import { generateTypesForRestApiConfig } from "./rest/open-api-import";
import { ConfigUtils } from "./utils/config-utils";
import { transformReducerFiles } from "./transformers/reducer-transformer";
import { AstUtils } from "./utils/ast-utils";
import { generateTypesForGraphqlQueriesInApp } from "./graphql";


let filesChanged: { path: string, event?: ts.FileWatcherEventKind }[] = []
let initialFiles: string[] = []



const formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: path => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine
};


/**
 *  converts ts-graphql-plugin  config to tstore GraphqlApi config 
 * @param tsconfig 
 */
function getGraphqlApiFromTsGraphqlPlugin(tsconfig: Record<string, any>): GraphqlApiConfig | undefined {
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


async function isValidGraphqlConfig(tsConfig: Record<string, any>, tstoreGraphqlApis?: GraphqlApiConfig[]) {
    let result: [boolean, string] = [true, ""]
    const graphqlApis: GraphqlApiConfig[] = []
    const tsGraphqPluginCOnfig = getGraphqlApiFromTsGraphqlPlugin(tsConfig)
    if (tsGraphqPluginCOnfig) {
        graphqlApis.push(tsGraphqPluginCOnfig)
    }
    if (tstoreGraphqlApis) {
        graphqlApis.push(...graphqlApis)
    }
    if (graphqlApis.length > 0) {
        const al = graphqlApis.length
        const sl = new Set(graphqlApis.map(ra => ra.name)).values.length
        if (al !== sl) {
            result = [false, "graphqlApis config names should be unique"]
        } else {
            result = await generateTypesForGraphqlQueriesInApp(graphqlApis)
        }
    }


    return result
}


async function isValidRestAPisConfig(restApis?: RestApiConfig[]): Promise<[boolean, string]> {
    let result: [boolean, string] = [true, ""]
    if (restApis && restApis.length > 0) {
        const al = restApis.length
        const sl = new Set(restApis.map(ra => ra.name)).values.length
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
async function isValidConfig(tsConfig: Record<string, any>): Promise<[boolean, string]> {
    let result: [boolean, string] = [true, ""]
    try {
        const tStoreObj = tsConfig[TYPESAFE_STORE_CONFIG_KEY]
        const validJson = typeSafeStoreConfigDecoder.run(tStoreObj)
        if (!validJson.ok) {
            result = [false, `not a valid config : ${JSON.stringify(validJson.error)}`]
        } else {
            const tStoreConfig: TypeSafeStoreConfig = tStoreObj as any
            if (!fs.lstatSync(resolve(tStoreConfig.storePath)).isDirectory()) {
                result = [false, "you should provide a valid storePath folder"]
            } else {
                // setStorePath(resolve(tStoreConfig.storePath))
                ConfigUtils.setConfig(tStoreConfig, tsConfig["compilerOptions"])
                result = await isValidRestAPisConfig(tStoreConfig.restApis)
                if (result[0]) { // valid restApis config 
                    result = await isValidGraphqlConfig(tsConfig, tStoreConfig.graphqlApis)
                }
            }
        }
    } catch (error) {
        result = [false, error]
    }

    return result;
}

async function watchMain() {
    const configPath = ts.findConfigFile(
    /*searchPath*/ "./",
        ts.sys.fileExists,
        "tsconfig.json"
    );
    if (!configPath) {
        throw new Error("Could not find a valid 'tsconfig.json'.");
    }

    console.log("Config Path : ", configPath);

    const tsConfig = ts.parseConfigFileTextToJson(configPath, fs.readFileSync(configPath, "utf-8")).config

    if (!tsConfig[TYPESAFE_STORE_CONFIG_KEY]) {
        throw new Error("You didn't provided valid typesafe-store config ,please follow the documentation link : TODO ")
    }
    const [validConfig, message] = await isValidConfig(tsConfig[TYPESAFE_STORE_CONFIG_KEY])
    if (!validConfig) {
        throw new Error(`You didn't provided valid typesafe-store config : ${message},please follow the documentation link : TODO `)
    }

    //populate config
    // setTypeSafeStoreConfig(tsConfig)

    // TypeScript can use several different program creation "strategies":
    //  * ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    //  * ts.createSemanticDiagnosticsBuilderProgram
    //  * ts.createAbstractBuilder
    // The first two produce "builder programs". These use an incremental strategy
    // to only re-check and emit files whose contents may have changed, or whose
    // dependencies may have changes which may impact change the result of prior
    // type-check and emit.
    // The last uses an ordinary program which does a full type check after every
    // change.
    // Between `createEmitAndSemanticDiagnosticsBuilderProgram` and
    // `createSemanticDiagnosticsBuilderProgram`, the only difference is emit.
    // For pure type-checking scenarios, or when another tool/process handles emit,
    // using `createSemanticDiagnosticsBuilderProgram` may be more desirable.
    const createProgram = ts.createSemanticDiagnosticsBuilderProgram;


    // Note that there is another overload for `createWatchCompilerHost` that takes
    // a set of root files.
    const host = ts.createWatchCompilerHost(
        configPath,
        {},
        ts.sys,
        createProgram,
        undefined, // Don't provide custom reporting ,just go with the default
        reportWatchStatusChanged
    );

    // You can technically override any given hook on the host, though you probably
    // don't need to.
    // Note that we're assuming `origCreateProgram` and `origPostProgramCreate`
    // doesn't use `this` at all.
    // const origCreateProgram = host.createProgram;
    // host.createProgram = (
    //     rootNames: ReadonlyArray<string> | undefined,
    //     options,
    //     host,
    //     oldProgram
    // ) => {
    //     console.log("** We're about to create the program! **");
    //     const p = origCreateProgram(rootNames, options, host, oldProgram);
    //     setProgram(p.getProgram())
    //     return p
    // };
    const origPostProgramCreate = host.afterProgramCreate;

    host.afterProgramCreate = program => {
        AstUtils.setProgram(program.getProgram())
        // console.log("** We finished making the program! **");
        origPostProgramCreate!(program);
    };


    const origWatchFile = host.watchFile
    host.watchFile = (path, cb) => {
        if (path.includes(ConfigUtils.getConfig().reducersPath)) {
            initialFiles.push(path)
        }
        return origWatchFile(path, (f, e) => {
            handleFileChange(f, e)
            cb(f, e)
        })
    }


    // `createWatchProgram` creates an initial program, watches files, and updates
    // the program over time.
    const wp = ts.createWatchProgram(host);
    // setWatchCompilerHost(wp)
    AstUtils.setProgram(wp.getProgram().getProgram())
}

function reportDiagnostic(diagnostic: ts.Diagnostic) {
    console.error(
        "Error",
        diagnostic.code,
        ":",
        ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            formatHost.getNewLine()
        )
    );
}



/**
 * Prints a diagnostic every time the watch status changes.
 * This is mainly for messages like "Starting compilation" or "Compilation completed".
 */
function reportWatchStatusChanged(diagnostic: ts.Diagnostic) {
    // if (initialFiles.length > 0 && program) {
    //     transformFiles(initialFiles)
    //     initialFiles = []
    // }
    console.info(ts.formatDiagnostic(diagnostic, formatHost));
    // console.info("********** diag: ********** ", diagnostic)
    processFiles(diagnostic)

}

function processFiles(diagnostic: ts.Diagnostic) {
    const msg = diagnostic.messageText.toString()
    if (diagnostic.code !== 6032 &&
        diagnostic.category !== ts.DiagnosticCategory.Error
        && (msg.includes("Found 0 errors") || !msg.includes("error"))
        && filesChanged.length > 0) {
        filesChanged.forEach(f => {
            transformReducerFiles([f.path])
        })
        filesChanged = []
    }
}

function handleFileChange(f: string, e: ts.FileWatcherEventKind) {
    const config = ConfigUtils.getConfig()
    if (f.includes(config.reducersPath) && !f.includes(config.reducersGeneratedPath)) {
        if (e == ts.FileWatcherEventKind.Deleted) {
            //handle deleted files

        } else {
            filesChanged.push({ path: f, event: e })
        }
    }

}

watchMain();