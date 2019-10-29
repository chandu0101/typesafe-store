import * as ts from "typescript";



export const isMethod = (input: ts.Symbol) => {
    return ts.isMethodDeclaration(input.declarations[0])
}


export const getMembersofTypeNode = (type: ts.TypeNode, typeChecker: ts.TypeChecker) => {
    return typeChecker.getPropertiesOfType(typeChecker.getTypeFromTypeNode(type))
}


export const getTypeName = (type: ts.TypeNode, typeChecker: ts.TypeChecker) => {
    return typeChecker.typeToString(typeChecker.getTypeFromTypeNode(type))
}

export const isPropertyDecl = (input: ts.Symbol) => {
    return ts.isPropertyDeclaration(input.declarations[0])
}

export const getPropDeclsFromTypeMembers = (members: ts.Symbol[]) => {
    return members.filter(isPropertyDecl).map(m => m.declarations[0] as ts.PropertyDeclaration)
}

export const getMethodsFromTypeMembers = (props: ts.Symbol[]) => {
    return props.filter(isMethod).map(p => p.declarations[0] as ts.MethodDeclaration)
}


export const getTypeOfPropertyDecl = (input: ts.PropertyDeclaration, checker: ts.TypeChecker) => {
    checker.getTypeAtLocation(input)
}


//TODO unfinshed
export const getNameofPropertyName = (p: ts.PropertyName) => {
    if (ts.isIdentifier(p)) {
        return p.escapedText.toString()
    }
    return p.toString()
}


export const createPropertyAccessForString = (input: string[]): ts.PropertyAccessExpression => {
    if (input.length == 2) {
        const f = input[0]
        const n = f === "this" ? ts.createThis() : ts.createIdentifier(f)
        return ts.createPropertyAccess(n, ts.createIdentifier(input[1]))
    }
    const l = input[input.length - 1]
    input.pop()
    return ts.createPropertyAccess(createPropertyAccessForString(input), ts.createIdentifier(l))
}

export const replaceThisIdentifier = (input: ts.PropertyAccessExpression, prefix?: string): ts.PropertyAccessExpression => {
    if (input.expression.kind === ts.SyntaxKind.ThisKeyword) {
        if (prefix) return ts.createIdentifier(`${prefix}${getNameofPropertyName(input.name)}`) as any
        return ts.createPropertyAccess(ts.createIdentifier("state"), input.name)
    }
    if (input.questionDotToken) {
        return ts.createPropertyAccessChain(replaceThisIdentifier(input.expression as any, prefix), input.questionDotToken, input.name)
    }

    return ts.createPropertyAccess(replaceThisIdentifier(input.expression as any, prefix), input.name)
}



export function groupBy<T, K extends keyof T>(objectArray: T[], property: K) {
    return objectArray.reduce(function (acc: Map<T[K], T[]>, obj) {
        var key = obj[property];
        if (!acc.has(key)) {
            acc.set(key, []);
        }
        acc.get(key)!.push(obj);
        return acc;
    }, new Map());
}


export function groupByValue<T extends { value: any }>(objectArray: T[], property: keyof T): Record<string, string[]> {
    return objectArray.reduce(function (acc: any, obj) {
        var key = obj[property];
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(obj.value);
        return acc;
    }, {});
}