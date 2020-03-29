
import * as ts from "typescript"


let program: ts.Program = null as any;
let typeChecker: ts.TypeChecker = null as any;


/**
 *   Typescript AST utils 
 */
export class AstUtils {

    static setProgram(p: ts.Program) {
        program = p
        typeChecker = p.getTypeChecker()
    }

    static getProgram() {
        return program;
    }

    static getTypeChecker() {
        return typeChecker
    }

    static getSourceFile(file: string): ts.SourceFile | undefined {
        return program.getSourceFile(file)
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
        return typeChecker.typeToString(type, undefined, ts.TypeFormatFlags.NoTruncation)
    }


    static isArrayType(input: ts.Type) {
        // console.log("Checking array for type2 : ", input.flags, "toString : ", typeChecker.typeToString(input),
        // "Node :");
        // const s = input.symbol.valueDeclaration
        return ts.isArrayTypeNode(typeChecker.typeToTypeNode(input)!);
    }

    /**
     *  
     * @param file 
     * @param cond 
     */
    static getAllNodes(file: string, cond: (node: ts.Node) => boolean): ts.Node[] {
        const sf = this.getSourceFile(file)
        let result: ts.Node[] = []
        if (!sf) return result
        function find(node: ts.Node) {
            if (cond(node)) {
                result.push(node)
                return
            } else {
                ts.forEachChild(node, find)
            }
        }
        find(sf)
        return result
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
    static getDefnitionOfIdentifierNode(file: string, node: ts.Node): { fileName: string, textSpan: any } {

        return null as any
    }

}