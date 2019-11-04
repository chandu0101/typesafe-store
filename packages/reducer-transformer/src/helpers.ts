import * as ts from "typescript";


let typeChecker: ts.TypeChecker = null as any

let typeNode: ts.TypeNode = null as any

let members: ts.Symbol[] = null as any

let memebrTypes: { name: string, type: ts.Type }[] = null as any


export function setTypeCheckerAndNode(tc: ts.TypeChecker, tn: ts.TypeNode) {
    typeChecker = tc;
    typeNode = tn;
    members = getMembers()
    memebrTypes = members.map(s => {
        return { type: typeChecker.getTypeOfSymbolAtLocation(s, typeNode), name: s.escapedName.toString() }
    })
}
export function getTypeChecker() {
    return typeChecker;
}

export function getTypeNode() {
    return typeNode;
}

export function cleanUpGloabals() {
    typeChecker = null as any
    typeNode = null as any
    members = null as any
    memebrTypes = null as any
}

export function isMethod(input: ts.Symbol) {
    return ts.isMethodDeclaration(input.declarations[0])
}


export function getMembersofTypeNode(type: ts.TypeNode, typeChecker: ts.TypeChecker) {
    return typeChecker.getPropertiesOfType(typeChecker.getTypeFromTypeNode(type))
}


export function getMembers() {
    return getMembersofTypeNode(typeNode, typeChecker)
}

export function getTypeName() {

    return typeChecker.typeToString(typeChecker.getTypeFromTypeNode(typeNode))
}

export const isPropertyDecl = (input: ts.Symbol) => {
    return ts.isPropertyDeclaration(input.declarations[0])
}

export const getPropDeclsFromTypeMembers = () => {
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


export function getTypeForPropertyAccess(input: string) {

    const a = input.split(".")
    if (a.length == 1) {
        return memebrTypes.find(mt => mt.name === a[0])!.type
    }
    const x = input.split(".")[0]


}

export function processThisStatement(input: ts.PropertyAccessExpression | ts.ElementAccessExpression, text: string, result:
    { name: string, meta: { isOptional?: boolean, isArray?: boolean, identifier?: ts.Expression } }[] = []): any {
    if (ts.isPropertyAccessExpression(input)) {
        if (input.expression.kind === ts.SyntaxKind.ThisKeyword) {
            result.forEach(v => {
                v.name = `${input.name.getText()}.${v.name}`
            })
            result.push({ name: input.name.getText(), meta: {} })
            return result
        }
        result.forEach(v => {
            v.name = `${input.name.getText()}.${v.name}`
        })
        result.push({ name: input.name.getText(), meta: {} })
        return processThisStatement(input.expression as any, text, result)
    } else if (ts.isPropertyAccessChain(input)) {
        result.forEach(v => {
            v.name = `${input.name.getText()}.${v.name}`
        })
        result.push({ name: input.name.getText(), meta: { isOptional: !!input.questionDotToken } })
        return processThisStatement(input.expression as any, text, result)
    } else if (ts.isNonNullExpression(input)) {
        return processThisStatement(input.expression as any, text, result)
    }
    else {
        if (ts.isElementAccessChain(input)) {

            const last = result[result.length - 1]
            if (input.questionDotToken) {
                last.meta.isOptional = true
            }
            last.meta.identifier = input.argumentExpression
            return processThisStatement(input.expression as any, text, result)
        }
        const last = result[result.length - 1]
        last.meta.identifier = input.argumentExpression
        return processThisStatement(input.expression as any, text, result)
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