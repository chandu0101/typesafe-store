import * as fs from "fs";
import * as ts from "typescript";

function watch(rootFileNames: string[], options: ts.CompilerOptions) {
    const files: ts.MapLike<{ version: number }> = {};

    // initialize the list of files
    rootFileNames.forEach(fileName => {
        files[fileName] = { version: 0 };
    });

    // Create the language service host to allow the LS to communicate with the host
    const servicesHost: ts.LanguageServiceHost = {
        getScriptFileNames: () => rootFileNames,
        getScriptVersion: fileName =>
            files[fileName] && files[fileName].version.toString(),
        getScriptSnapshot: fileName => {
            if (!fs.existsSync(fileName)) {
                return undefined;
            }

            return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
        },
        getCurrentDirectory: () => process.cwd(),
        getCompilationSettings: () => options,
        getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
        fileExists: ts.sys.fileExists,
        readFile: ts.sys.readFile,
        readDirectory: ts.sys.readDirectory
    };

    // Create the language service files
    const services = ts.createLanguageService(
        servicesHost,
        ts.createDocumentRegistry()
    );

    // Now let's watch the files
    rootFileNames.forEach(fileName => {
        // First time around, emit all files
        emitFile(fileName);


        // Add a watch on the file to handle next change
        fs.watchFile(fileName, { persistent: true, interval: 250 }, (curr, prev) => {
            // Check timestamp
            if (+curr.mtime <= +prev.mtime) {
                return;
            }

            // Update the version to signal a change in the file
            files[fileName].version++;

            // write the changes to disk
            emitFile(fileName);
        });
    });

    function emitFile(fileName: string) {
        console.log("emitting ", fileName);
        // let output = services.getEmitOutput(fileName);

        // if (!output.emitSkipped) {
        //     console.log(`Emitting ${fileName}`);
        // } else {
        //     console.log(`Emitting ${fileName} failed`);
        //     logErrors(fileName);
        // }

        // output.outputFiles.forEach(o => {
        //     fs.writeFileSync(o.name, o.text, "utf8");
        // });
    }

    function logErrors(fileName: string) {
        let allDiagnostics = services
            .getCompilerOptionsDiagnostics()
            .concat(services.getSyntacticDiagnostics(fileName))
            .concat(services.getSemanticDiagnostics(fileName));

        allDiagnostics.forEach(diagnostic => {
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
                    diagnostic.start!
                );
                console.log(
                    `  Error ${diagnostic.file.fileName} (${line + 1},${character +
                    1}): ${message}`
                );
            } else {
                console.log(`  Error: ${message}`);
            }
        });
    }
}

// Initialize files constituting the program as all .ts files in the current directory
const currentDirectoryFiles = fs
    // .readdirSync("./src/test/reducers")
    .readdirSync(process.cwd())
    .filter(
        fileName =>
            fileName.length >= 3 && fileName.substr(fileName.length - 3, 3) === ".ts"
    );

console.log("files :", currentDirectoryFiles);

// Start the watcher
// watch(currentDirectoryFiles, { module: ts.ModuleKind.CommonJS });


const formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: path => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine
};

function watchMain() {
    const configPath = ts.findConfigFile(
    /*searchPath*/ "./",
        ts.sys.fileExists,
        "tsconfig.json"
    );
    if (!configPath) {
        throw new Error("Could not find a valid 'tsconfig.json'.");
    }

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
        reportDiagnostic,
        reportWatchStatusChanged
    );




    // You can technically override any given hook on the host, though you probably
    // don't need to.
    // Note that we're assuming `origCreateProgram` and `origPostProgramCreate`
    // doesn't use `this` at all.
    const origCreateProgram = host.createProgram;
    host.createProgram = (
        rootNames: ReadonlyArray<string> | undefined,
        options,
        host,
        oldProgram
    ) => {
        console.log("** We're about to create the program! **");
        return origCreateProgram(rootNames, options, host, oldProgram);
    };
    const origPostProgramCreate = host.afterProgramCreate;

    host.afterProgramCreate = program => {
        console.log("** We finished making the program! **");
        origPostProgramCreate!(program);
    };


    const origWaychFile = host.watchFile

    host.watchFile = (path, cb) => {
        // console.log("Changed File : ", path, cb);
        return origWaychFile(path, (f, e) => {
            console.log("Changed File2 : ", f, e);
            cb(f, e)
        })
    }

    // const origWatchDir = host.watchDirectory

    // host.watchDirectory = (path, cb) => {
    //     console.log("ChangeDir", path);
    //     return origWatchDir(path, (f) => {
    //         console.log("File Changed ", f);
    //     })
    // }
    // `createWatchProgram` creates an initial program, watches files, and updates
    // the program over time.


    const wp = ts.createWatchProgram(host);

    const typeChecker = wp.getProgram().getProgram().getTypeChecker()

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
    console.info(ts.formatDiagnostic(diagnostic, formatHost));
}

watchMain();