import * as fs from "fs";
import * as ts from "typescript";
import { transformFiles } from "./util";
import { setWatchCompilerHost, setProgram } from "./helpers";
import { TypeSafeStoreConfig, SupportedFrameworks } from "./types";
import { TYPESAFE_STORE_CONFIG_STORE_PATH_KEY, TYPESAFE_STORE_CONFIG_FRAMEWORK_KEY, TYPESAFE_STORE_CONFIG_KEY, REDUCERS_FOLDER, GENERATED_FOLDER } from "./constants";
import { resolve, join } from "path";


let filesChanged: { path: string, event?: ts.FileWatcherEventKind }[] = []
let initialFiles: string[] = []
let config: TypeSafeStoreConfig = null as any


const formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: path => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine
};


export function getTypesSafeStoreConfig() {
    return config
}

function isValidConfig(obj: Record<string, string>): [boolean, string] {
    let result: [boolean, string] = [true, ""]
    if (!obj[TYPESAFE_STORE_CONFIG_STORE_PATH_KEY]) {
        result = [false, "you should provide a valid storePath "]
    } else {
        const storePath = obj[TYPESAFE_STORE_CONFIG_STORE_PATH_KEY]
        if (!fs.existsSync(storePath)) {
            result = [false, "you should provide a valid storePath "]
        } else {
            const framework = obj[TYPESAFE_STORE_CONFIG_FRAMEWORK_KEY]
            if (!Object.entries(SupportedFrameworks).map(([key, value]) => value.toString()).includes(framework)) {
                result = [false, `${framework} is not supported yet!, please file an issue if you want it.`]
            }
        }
    }

    return result;
}

function watchMain() {
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
    const [validConfig, message] = isValidConfig(tsConfig[TYPESAFE_STORE_CONFIG_KEY])
    if (!validConfig) {
        throw new Error(`You didn't provided valid typesafe-store config : ${message},please follow the documentation link : TODO `)
    }

    //populate config
    config = tsConfig[TYPESAFE_STORE_CONFIG_KEY]
    config.storePath = resolve(config.storePath)
    config.reducersPath = join(config.storePath, REDUCERS_FOLDER)
    //TODO create folder then assign    
    config.reducersGeneratedPath = join(config.reducersGeneratedPath, GENERATED_FOLDER)

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
        console.log("** We finished making the program! **");
        origPostProgramCreate!(program);
    };


    const origWatchFile = host.watchFile
    host.watchFile = (path, cb) => {
        if (path.includes(config.reducersPath)) {
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
    if (f.includes(config.reducersPath) && !f.includes(config.reducersGeneratedPath)) {
        if (e == ts.FileWatcherEventKind.Deleted) {
            //handle deleted files
        } else {
            filesChanged.push({ path: f, event: e })
        }
    }

}

watchMain();