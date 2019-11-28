import * as ts from "typescript";
import { createReducerFunction } from "./generate";
import * as fs from "fs"
export interface TranformerOptions {

}

let r = ""


export function transformer(program: ts.Program, _opts?: TranformerOptions) {
    const visitor = (ctx: ts.TransformationContext, sf: ts.SourceFile, _result: { seen: boolean }) => {
        const typeChecker = program.getTypeChecker();
        const visitor: ts.Visitor = (node: ts.Node) => {
            if (ts.isCallExpression(node) && node.typeArguments && node.expression.getText(sf) == "getReducerGroup") {
                const [type] = node.typeArguments;
                console.log("fileName2 : ",
                    __dirname, sf.fileName, sf.referencedFiles, sf.moduleName);
                const f = sf.fileName;
                (global as any).r = `
                  type Sample2 = { a:string,y:string}
                `
                // fs.writeFileSync(f.replace("reducer.test.ts", "reducer.generated.ts"), c, { encoding: "utf8" })
                return createReducerFunction({ type, typeChecker })
            }
            return ts.visitEachChild(node, visitor, ctx)
        }

        return visitor;
    }

    return (ctx: ts.TransformationContext) => {
        return (sf: ts.SourceFile) => {
            const result = { seen: false };
            const newSf = ts.visitNode(sf, visitor(ctx, sf, result));

            // if (result.seen) {
            //     const fn = createGenerateFunction();
            //     return ts.updateSourceFileNode(newSf, [fn, ...newSf.statements]);
            // }

            return newSf;
        };
    }
}