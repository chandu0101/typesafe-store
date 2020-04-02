
import * as ts from "typescript"
import { MetaUtils } from "./meta-utils";


/**
 *   Typescript AST utils 
 */
export class AstUtils {

    static setProgram(p: ts.Program) {
        MetaUtils.setProgram(p)
    }

    static getProgram() {
        return MetaUtils.getProgram();
    }

    static getTypeChecker() {
        return this.getProgram().getTypeChecker()
    }

    static getSourceFile(file: string): ts.SourceFile | undefined {
        return this.getProgram().getSourceFile(file)
    }

    static isMethod(input: ts.Symbol) {
        return ts.isMethodDeclaration(input.declarations[0]);
    }

    static getMembersofTypeNode(
        type: ts.TypeNode,
        typeChecker: ts.TypeChecker
    ) {
        return typeChecker.getPropertiesOfType(typeChecker.getTypeFromTypeNode(type));
    }

    static getMembersOfType(type: ts.Type, node: ts.Node) {
        const typeChecker = this.getTypeChecker()
        return typeChecker.getPropertiesOfType(type).map(s => {
            return {
                type: typeChecker.getNonNullableType(
                    typeChecker.getTypeOfSymbolAtLocation(s, node)
                ),
                name: s.escapedName.toString()
            };
        });
    }

    static isTypeReference(type: ts.Type): type is ts.TypeReference {
        return !!(
            type.getFlags() & ts.TypeFlags.Object &&
            (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference
        );
    }

    /**
     * 
     * @param type 
     */
    static typeToString(type: ts.Type) {
        return this.getTypeChecker().typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation)
    }


    static isArrayType(input: ts.Type) {
        // console.log("Checking array for type2 : ", input.flags, "toString : ", typeChecker.typeToString(input),
        // "Node :");
        // const s = input.symbol.valueDeclaration
        return ts.isArrayTypeNode(this.getTypeChecker().typeToTypeNode(input)!);
    }

    static findAllNodes(sf: ts.SourceFile, cond: (node: ts.Node) => boolean) {
        const result: ts.Node[] = [];
        function find(node: ts.Node) {
            if (cond(node)) {
                result.push(node);
                return;
            } else {
                ts.forEachChild(node, find);
            }
        }
        find(sf);
        return result;
    }

    static findAllNodesInsideNode(node: ts.Node, cond: (node: ts.Node) => boolean) {
        const result: ts.Node[] = [];
        function find(node: ts.Node) {
            if (cond(node)) {
                result.push(node);
                return;
            } else {
                ts.forEachChild(node, find);
            }
        }
        find(node);
        return result;
    }

    /**
     *  
     * @param file 
     * @param cond 
     */
    static findAllNodesFromFile(file: string, cond: (node: ts.Node) => boolean): ts.Node[] {
        const sf = this.getSourceFile(file)
        if (!sf) {
            return []
        }
        else {
            return this.findAllNodes(sf, cond)
        }

    }

    static findNode(file: string, position: number): ts.Node | undefined {
        const sourceFile = this.getSourceFile(file)
        if (!sourceFile) return undefined
        function find(node: ts.Node): ts.Node | undefined {
            if (position >= node.getStart() && position < node.getEnd()) {
                return ts.forEachChild(node, find) || node;
            }
        }
        return find(sourceFile);
    }

    /**
     *  //TODO https://stackoverflow.com/questions/60908093/how-to-get-source-file-of-identifier-node-typescript-compiler
     * @param file 
     * @param node 
     */
    static getDeclarationOfIdentifierNode(node: ts.Node): ts.Node {

        return this.getTypeChecker().getSymbolAtLocation(node)!.declarations[0]
    }

    static transformImportNodeToGeneratedFolderImportNodes(input: ts.ImportDeclaration) {
        const ms = input.moduleSpecifier.getText()
        let result = input.getText()
        if (ms.startsWith("\"./")) {
            result = result.replace(".", "..")
        } else if (ms.startsWith("\"..")) {
            result = result.replace("..", "../..")
        }
        return ts.createIdentifier(result)
    }

    static isPropertyOrElementAccessExpression(node: ts.Node, obj: string): node is (ts.PropertyAccessExpression | ts.ElementAccessExpression) {
        return (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) && node.getText().startsWith(`${obj}.`)
    }

    static getTypeOfNode(node: ts.Node) {
        const t = this.getTypeChecker().getTypeAtLocation(node)
        return this.typeToString(t)
    }
}