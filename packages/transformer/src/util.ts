import * as ts from "typescript";
import { promises as fs, writeFileSync, readFileSync } from "fs";

import { performance } from "perf_hooks";
import { createReducerFunction } from "./generate";
import { getProgram } from "./helpers";

const reducerTransformer: ts.TransformerFactory<ts.SourceFile> = context => {
  const visit: ts.Visitor = node => {
    node = ts.visitEachChild(node, visit, context);
    if (ts.isClassDeclaration(node)) {
      console.log("class found and processing");
      const name = node.name?.text || "default";
      // fs.writeFileSync(f.replace("reducer.test.ts", "reducer.generated.ts"), c, { encoding: "utf8" })
      return createReducerFunction(node);
    }
    if (ts.isTypeAliasDeclaration(node)) {
      return null as any;
    }
    return node;
  };

  return node => ts.visitNode(node, visit);
};

function transformFile(file: string) {
  console.log("transforming file : ", file);
  const t0 = performance.now();
  const sf = getProgram().getSourceFile(file)!;
  const printer = ts.createPrinter();
  const newSf = ts.transform(sf, [reducerTransformer]).transformed[0];
  const content = `
     // this file is auto generated on ${new Date().toISOString()}, don't modify it
     import { ReducerGroup,AsyncData } from "@typesafe-store/reducer"
     ${printer.printFile(newSf)}
    `;
  writeFileSync(file.replace("/reducers/", "/reducers/generated/"), content, {
    encoding: "utf8"
  });
  const t1 = performance.now();
  console.log("time : ", t1 - t0, " ms");
}

export function transformFiles(files: string[]) {
  console.log("transforming files: ", files);
  files.forEach(f => {
    transformFile(f);
  });
}
