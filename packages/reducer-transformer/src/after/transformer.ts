import * as ts from "typescript";
import * as fs from "fs"
export interface TranformerOptions {

}

let r = ""


export function transformer(program: ts.Program, _opts?: TranformerOptions) {
    const visitor = (ctx: ts.TransformationContext, sf: ts.SourceFile, _result: { seen: boolean }) => {
        const typeChecker = program.getTypeChecker();
        const visitor: ts.Visitor = (node: ts.Node) => {
            if (ts.isClassDeclaration(node)) {
                console.log("after transformer function node matched");
                // console.log("fileName2 : ",
                //     __dirname, sf.fileName, sf.referencedFiles, sf.moduleName);
                const f = sf.fileName
                // r = `
                //   type Sample2 = { a:string,y:string}
                // `
                fs.writeFileSync(f.replace("reducer.test.ts", "reducer.generated.ts"), (global as any).r
                    , { encoding: "utf8" })
                return node
            }
            return ts.visitEachChild(node, visitor, ctx)
        }

        return visitor;
    }

    return (ctx: ts.TransformationContext) => {
        console.log("Calling After transformer2");
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