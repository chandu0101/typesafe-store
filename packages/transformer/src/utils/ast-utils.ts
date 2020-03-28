
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

}