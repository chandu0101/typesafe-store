
import * as ts from "typescript"
import { MetaUtils } from "./meta-utils";
import { resolve, join, dirname } from "path";
import { FileUtils } from "./file-utils";


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

    static getNonNullableType(type: ts.Type): ts.Type {
        return this.getTypeChecker().getNonNullableType(type)
    }

    static getMembersOfType(type: ts.Type, node: ts.Node, nonNull?: boolean) {
        const typeChecker = this.getTypeChecker()
        type = this.getNonNullableType(type)
        return typeChecker.getPropertiesOfType(type).map(s => {
            let st = typeChecker.getTypeOfSymbolAtLocation(s, node)
            if (nonNull) {
                st = this.getTypeChecker().getNonNullableType(st)
            }
            return {
                type: st,
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

    static typeNodeToString(typeNode: ts.TypeNode) {
        return this.typeToString(this.getTypeChecker().getTypeFromTypeNode(typeNode))
    }

    /**
     *  Another Impl  return (this.getTypeChecker() as any).isArrayType(type)
     *  https://github.com/microsoft/TypeScript/issues/37711
     * @param input 
     */
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
        if (ms.startsWith("\"./") || ms.startsWith("'./")) {
            result = result.replace(".", "..")
        } else if (ms.startsWith("\"..") || ms.startsWith("'..")) {
            result = result.replace("..", "../..")
        }
        return ts.createIdentifier(result)
    }

    static isPropertyOrElementAccessExpression(node: ts.Node, obj: string): node is (ts.PropertyAccessExpression | ts.ElementAccessExpression) {
        return (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) && node.getText().startsWith(`${obj}.`)
    }

    static getTypeStrOfNode(node: ts.Node) {
        const t = this.getTypeChecker().getTypeAtLocation(node)
        return this.typeToString(t)
    }

    static getTypeOfNode(node: ts.Node) {
        return this.getTypeChecker().getTypeAtLocation(node)
    }

    static isNodeArrayType(node: ts.Node) {
        return this.isArrayType(this.getTypeOfNode(node))
    }

    static getDeclarationOfImportSpecifier(sourceFile: ts.SourceFile, fn: ts.ImportSpecifier | ts.ImportClause) {
        const importDecls = this.findAllNodes(sourceFile, (node: ts.Node) => ts.isImportDeclaration(node)) as ts.ImportDeclaration[]
        const fnName = fn.getText()
        let path = ""
        importDecls.forEach(id => {
            const ic = id.importClause
            let module = id.moduleSpecifier.getText().slice(1, -1)
            if (ic) {
                if ((ic.name && ic.name.getText() === fnName)) { // default import (ex: import x from "module")
                    path = module
                    return
                }
                if (ic.namedBindings) {
                    if (ts.isNamespaceImport(ic.namedBindings) && ic.namedBindings.name.getText() === fnName) {
                        path = module
                        return
                    }
                    if (ts.isNamedImports(ic.namedBindings)) {
                        ic.namedBindings.elements.forEach(is => {
                            if (is.getText() === fnName) {
                                path = module
                                return
                            }
                        })
                    }

                }
            }
        })
        path = join(dirname(sourceFile.fileName), path)
        if (FileUtils.isDirectory(path)) { // index.ts import 
            path = join(path, "index.ts")
        } else {
            path = `${path}.ts`
        }
        const resolvedPath = resolve(path)
        console.log("Resolved Path : ", resolvedPath);
        const sf = this.getProgram().getSourceFile(path)
        console.log("Source file for path :", sf?.fileName);

    }

}