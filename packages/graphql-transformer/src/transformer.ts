import * as ts from "typescript";
import { createReducerFunction } from "./generate";
import * as fs from "fs"
export interface TranformerOptions {

}




export function transformer(program: ts.Program, _opts?: TranformerOptions) {
    const visitor = (ctx: ts.TransformationContext, sf: ts.SourceFile, ) => {
        const typeChecker = program.getTypeChecker();
        const visitor: ts.Visitor = (node: ts.Node) => {
            if (ts.isCallExpression(node) && node.expression.getText(sf) == "gqlQuery") {
                console.log("fileName2 : ",
                    __dirname, sf.fileName, sf.referencedFiles, sf.moduleName);
                const f = sf.fileName
                const c = `
                  type Sample2 = { a:string,y:string}
                `
                fs.writeFileSync(f.replace("reducer.test.ts", "reducer.generated.ts"), c, { encoding: "utf8" })
                return node
            }
            return ts.visitEachChild(node, visitor, ctx)
        }

        return visitor;
    }

    return (ctx: ts.TransformationContext) => {
        return (sf: ts.SourceFile) => {
            const newSf = ts.visitNode(sf, visitor(ctx, sf));
            return newSf;
        };
    }
}