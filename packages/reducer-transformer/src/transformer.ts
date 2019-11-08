import * as ts from "typescript";
import { createReducerFunction } from "./generate";
export interface TranformerOptions {

}




export function transformer(program: ts.Program, _opts?: TranformerOptions) {
    const visitor = (ctx: ts.TransformationContext, sf: ts.SourceFile, _result: { seen: boolean }) => {
        const typeChecker = program.getTypeChecker();
        const visitor: ts.Visitor = (node: ts.Node) => {
            if (ts.isCallExpression(node) && node.typeArguments && node.expression.getText(sf) == "getReducer") {
                const [type] = node.typeArguments;
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