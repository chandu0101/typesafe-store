import * as ts from "typescript";
import { getTypeChecker, getTypeNode } from "./generate";



export function isMethod(input: ts.Symbol) {
    return ts.isMethodDeclaration(input.declarations[0])
}


export function getMembersofTypeNode(type: ts.TypeNode, typeChecker: ts.TypeChecker) {
    return typeChecker.getPropertiesOfType(typeChecker.getTypeFromTypeNode(type))
}


export function getMembers() {
    return getMembersofTypeNode(getTypeNode(), getTypeChecker())
}

export function getTypeName() {
    const tc = getTypeChecker()
    return tc.typeToString(tc.getTypeFromTypeNode(getTypeNode()))
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

export function isPushStatement(s: ts.Statement) {
    return ts.isExpressionStatement(s) && ts.isCallExpression(s.expression)
        && ts.isPropertyAccessExpression(s.expression.expression)
        && s.expression.expression.name.escapedText.toString() === "push"
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

export function replaceThisIdentifier(input: ts.PropertyAccessExpression | ts.ElementAccessExpression, prefix?: string):
    ts.PropertyAccessExpression | ts.ElementAccessExpression | ts.NonNullExpression {
    if (ts.isPropertyAccessExpression(input)) {
        if (input.expression.kind === ts.SyntaxKind.ThisKeyword) {
            if (prefix) return ts.createIdentifier(`${prefix}${getNameofPropertyName(input.name)}`) as any
            return ts.createPropertyAccess(ts.createIdentifier("state"), input.name)
        }
        return ts.createPropertyAccess(replaceThisIdentifier(input.expression as any, prefix), input.name)
    } else if (ts.isPropertyAccessChain(input)) {
        return ts.createPropertyAccessChain(replaceThisIdentifier(input.expression as any, prefix), input.questionDotToken, input.name)
    } else if (ts.isNonNullExpression(input)) {
        return ts.createNonNullExpression(replaceThisIdentifier(input.expression as any, prefix))
    }
    else {
        if (ts.isElementAccessChain(input)) {
            return ts.createElementAccessChain(replaceThisIdentifier(input.expression as any, prefix), input.questionDotToken, input.argumentExpression)
        }
        return ts.createElementAccess(replaceThisIdentifier(input.expression as any, prefix), input.argumentExpression)
    }
}


export function processThisStatement(input: ts.PropertyAccessExpression | ts.ElementAccessExpression, result: any): any {
    if (ts.isPropertyAccessExpression(input)) {
        if (input.expression.kind === ts.SyntaxKind.ThisKeyword) {
            return ts.createPropertyAccess(ts.createIdentifier("state"), input.name)
        }
        return ts.createPropertyAccess(processThisStatement(input.expression as any, prefix), input.name)
    } else if (ts.isPropertyAccessChain(input)) {
        return ts.createPropertyAccessChain(processThisStatement(input.expression as any, prefix), input.questionDotToken, input.name.getText())
    } else if (ts.isNonNullExpression(input)) {
        return ts.createNonNullExpression(processThisStatement(input.expression as any, prefix))
    }
    else {
        if (ts.isElementAccessChain(input)) {
            return ts.createElementAccessChain(processThisStatement(input.expression as any, prefix), input.questionDotToken, input.argumentExpression)
        }
        return ts.createElementAccess(processThisStatement(input.expression as any, prefix), input.argumentExpression)
    }


}


export function groupBy<T, K extends keyof T,>(objectArray: T[], property: K, value: K | undefined) {
    return objectArray.reduce(function (acc: Map<T[K], (T | T[K])[]>, obj) {
        var key = obj[property];
        if (!acc.has(key)) {
            acc.set(key, []);
        }
        if (value) {
            acc.get(key)!.push(obj[value]);
        } else {
            acc.get(key)!.push(obj);
        }
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