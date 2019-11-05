import * as ts from "typescript";


let typeChecker: ts.TypeChecker = null as any

let typeNode: ts.TypeNode = null as any

let members: ts.Symbol[] = null as any

let memberTypes: { name: string, type: ts.Type }[] = null as any


export function setTypeCheckerAndNode(tc: ts.TypeChecker, tn: ts.TypeNode) {
    typeChecker = tc;
    typeNode = tn;
    members = getMembersofTypeNode(typeNode, typeChecker)
    memberTypes = members.map(s => {
        return { type: typeChecker.getTypeOfSymbolAtLocation(s, typeNode), name: s.escapedName.toString() }
    })
}

export function cleanUpGloabals() {
    typeChecker = null as any
    typeNode = null as any
    members = null as any
    memberTypes = null as any
}

export function isMethod(input: ts.Symbol) {
    return ts.isMethodDeclaration(input.declarations[0])
}


export function getMembersofTypeNode(type: ts.TypeNode, typeChecker: ts.TypeChecker) {
    return typeChecker.getPropertiesOfType(typeChecker.getTypeFromTypeNode(type))
}


export function getMembersOfType(type: ts.Type) {
    return typeChecker.getPropertiesOfType(type).map(
        s => {
            return { type: typeChecker.getDeclaredTypeOfSymbol(s), name: s.escapedName.toString() }
        }
    )
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

export const getMethodsFromTypeMembers = () => {
    return members.filter(isMethod).map(p => p.declarations[0] as ts.MethodDeclaration)
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


export function getTypeForPropertyAccess(input: string[], mTypes: { name: string, type: ts.Type }[] = memberTypes): ts.Type {

    const t = memberTypes.find(mt => mt.name === input[0])!.type
    if (input.length == 1) {
        return t
    } else {
        return getTypeForPropertyAccess(input.slice(1), getMembersOfType(t))
    }
}

export function isArrayType(input: ts.Type) {
    const s = input.symbol.valueDeclaration
    return ts.isArrayTypeNode(s)
}

type Result = { name: string, meta: { isOptional?: boolean, isArray?: boolean, numberAcess?: number, stringAccess?: string, identifier?: ts.Expression } }
export function processThisStatement(input: ts.PropertyAccessExpression | ts.ElementAccessExpression, text: string, result:
    Result[] = []): Result[] {
    if (ts.isPropertyAccessExpression(input)) {
        if (input.expression.kind === ts.SyntaxKind.ThisKeyword) {
            const parent = input.name.getText()
            result.forEach(v => {
                v.name = `${parent}.${v.name}`
                v.meta.isArray = isArrayType(getTypeForPropertyAccess(v.name.split(".")))
            })
            result.push({ name: parent, meta: { isArray: isArrayType(getTypeForPropertyAccess([parent])) } })
            return result
        }
        result.forEach(v => {
            v.name = `${input.name.getText()}.${v.name}`
        })
        result.push({ name: input.name.getText(), meta: {} })
        return processThisStatement(input.expression as any, text, result)
    } else if (ts.isPropertyAccessChain(input)) {
        const parent = input.name.getText()
        result.forEach(v => {
            v.name = `${parent}.${v.name}`
        })
        result.push({ name: parent, meta: { isOptional: !!input.questionDotToken } })
        return processThisStatement(input.expression as any, text, result)
    } else if (ts.isNonNullExpression(input)) {
        return processThisStatement(input.expression as any, text, result)
    }
    else {
        const last = result[result.length - 1]
        if (ts.isNumericLiteral(input.argumentExpression)) {
            last.meta.numberAcess = parseInt(input.argumentExpression.getText(), 10)
        } else if (ts.isStringLiteral(input.argumentExpression)) {
            last.meta.stringAccess = input.argumentExpression.getText()
        } else {
            last.meta.identifier = input.argumentExpression
        }
        if (ts.isElementAccessChain(input)) {
            if (input.questionDotToken) {
                last.meta.isOptional = true
            }
            return processThisStatement(input.expression as any, text, result)
        }
        if (input.questionDotToken) {
            last.meta.isOptional = true
        }

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