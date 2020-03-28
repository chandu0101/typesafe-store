// import * as ts from "typescript";
// import { promises as fs, writeFileSync, readFileSync } from "fs";

// import { performance } from "perf_hooks";
// import { createReducerFunction } from "./generate";
// import { getProgram, dontModifyMessage, setCurrentProcessingReducerFile, getOutputPathForReducerSourceFile } from "./helpers";
// import { EMPTY_REDUCER_TRANFORM_MESSAGE } from "./constants";
// import { FileUtils } from "./utils/file-utils";

// const reducerTransformer: ts.TransformerFactory<ts.SourceFile> = context => {
//   const visit: ts.Visitor = node => {
//     node = ts.visitEachChild(node, visit, context);
//     if (ts.isClassDeclaration(node)) {
//       console.log("class found and processing");
//       const name = node.name?.text || "default";
//       // fs.writeFileSync(f.replace("reducer.test.ts", "reducer.generated.ts"), c, { encoding: "utf8" })
//       return createReducerFunction(node);
//     }
//     // if (ts.isTypeAliasDeclaration(node)) {
//     //   return null as any;
//     // }
//     return node;
//   };

//   return node => ts.visitNode(node, visit);
// };


