import * as fs from "fs";
import * as ts from "typescript";
import { transformFiles } from "./util";
import { setProgram, setTypeSafeStoreConfig, getTypeSafeStoreConfig, setStorePath } from "./helpers";
import { typeSafeStoreConfigDecoder, TypeSafeStoreConfig, RestApiConfig } from "./types";
import { TYPESAFE_STORE_CONFIG_KEY } from "./constants";
import { resolve } from "path";


let filesChanged: { path: string, event?: ts.FileWatcherEventKind }[] = []
let initialFiles: string[] = []



const formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: path => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine
};


async function isValidRestAPisConfig(restApis?: RestApiConfig[]): Promise<[boolean, string]> {
    let result: [boolean, string] = [true, ""]
    if (restApis && restApis.length > 0) {
        const al = restApis.length
        const sl = new Set(restApis.map(ra => ra.name)).values.length
        if (al !== sl) {
            result = [false, "restApis config names should be unique"]
        } else {

        }
    }
    return result
}


async function isValidConfig(obj: Record<string, string>): Promise<[boolean, string]> {
    let result: [boolean, string] = [true, ""]
    try {
        const validJson = typeSafeStoreConfigDecoder.run(obj)
        if (!validJson.ok) {
            result = [false, `not a valid config : ${validJson.error}`]
        } else {
            const config: TypeSafeStoreConfig = obj as any
            if (!fs.lstatSync(resolve(config.storePath)).isDirectory()) {
                result = [false, "you should provide a valid storePath folder"]
            } else {
                setStorePath(resolve(config.storePath))
                result = await isValidRestAPisConfig(config.restApis)
                if (result[0]) {

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
    setTypeSafeStoreConfig(tsConfig[TYPESAFE_STORE_CONFIG_KEY])

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
        setProgram(program.getProgram())
        // console.log("** We finished making the program! **");
        origPostProgramCreate!(program);
    };


    const origWatchFile = host.watchFile
    host.watchFile = (path, cb) => {
        if (path.includes(getTypeSafeStoreConfig().reducersPath)) {
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
    setProgram(wp.getProgram().getProgram())
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
            transformFiles([f.path])
        })
        filesChanged = []
    }
}

function handleFileChange(f: string, e: ts.FileWatcherEventKind) {
    if (f.includes(getTypeSafeStoreConfig().reducersPath) && !f.includes(getTypeSafeStoreConfig().reducersGeneratedPath)) {
        if (e == ts.FileWatcherEventKind.Deleted) {
            //handle deleted files

        } else {
            filesChanged.push({ path: f, event: e })
        }
    }

}

watchMain();