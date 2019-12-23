import * as ts from "typescript";



let wcp: ts.WatchOfConfigFile<ts.SemanticDiagnosticsBuilderProgram> = null as any

let program: ts.Program = null as any

let typeChecker: ts.TypeChecker = null as any

let classDecl: ts.ClassDeclaration = null as any

let members: ts.NodeArray<ts.ClassElement> = null as any

let memberTypes: { name: string, type: ts.Type }[] = null as any

let arrayMutableMethods = ["push", "pop", "fill", "copyWithin", "shift", "sort", "splice", "unshift"]

export function setWatchCompilerHost(p: typeof wcp) {
    wcp = p
}


export function setProgram(p: ts.Program) {
    program = p
}
export function getProgram() {
    return program
}

export function setClassDeclaration(cd: ts.ClassDeclaration) {
    // console.log("setting class declaration : ", cd.members);
    classDecl = cd;
    typeChecker = getProgram().getTypeChecker()
    const type = typeChecker.getTypeAtLocation(cd)
    members = cd.members
    memberTypes = typeChecker.getPropertiesOfType(type).map(pt => {
        return { name: pt.escapedName.toString(), type: typeChecker.getTypeOfSymbolAtLocation(pt, cd) }
    })
}

export function cleanUpGloabals() {
    // typeChecker = null as any
    classDecl = null as any
    members = null as any
    memberTypes = null as any
}

export const getStateType = () => {
    const props = getPropDeclsFromTypeMembers()
    return `{${props.map(p => {
        const n = p.name.getText()
        const t = memberTypes.find(mt => mt.name === n)!.type
        return `${n}:${typeChecker.typeToString(t)}`
    }).join(",")}}`
}

export const lastElementOfArray = <T>(a: T[]) => {
    return a[a.length - 1]
}


export const getActionType = () => {
    const methods = getMethodsFromTypeMembers()
    const group = getTypeName()
    return methods.map(m => {
        const n = m.name.getText()
        const pl = m.parameters.length
        if (pl === 0) {
            return `{name :"${n}",group:"${group}"}`
        }
        const t = typeChecker.typeToString(memberTypes.find(mt => mt.name === n)!.type)
        const pt = t.split("=>")[0].trim().slice(1).slice(0, -1)
        let p = ""
        if (pl === 1) {
            p = pt.slice(pt.indexOf(":") + 1).trim()
        } else {
            p = `{${pt}}`
        }
        return `{name :"${n}",group:"${group}",payload:${p}}`
    }).join(" | ")
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
    return classDecl.name!.getText()
}

export const isPropertyDecl = (input: ts.ClassElement) => {
    return ts.isPropertyDeclaration(input)
}

export const getPropDeclsFromTypeMembers = () => {
    return members.filter(ts.isPropertyDeclaration).map(m => m as ts.PropertyDeclaration)
}

export const getMethodsFromTypeMembers = () => {
    return members.filter(ts.isMethodDeclaration).map(p => p as ts.MethodDeclaration)
}


export const getTypeOfPropertyDecl = (input: ts.PropertyDeclaration, checker: ts.TypeChecker) => {
    checker.getTypeAtLocation(input)
}

export function isArrayMutatableAction(s: ts.Identifier) {
    const name = s.getText()
    return arrayMutableMethods.includes(name)
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
    const t = mTypes.find(mt => mt.name === input[0])!.type
    if (input.length == 1) {
        return t
    } else {
        return getTypeForPropertyAccess(input.slice(1), getMembersOfType(t))
    }
}


export function isArrayType(input: ts.Type) {
    console.log("Checking array for type2 : ", input.flags, "toString : ", typeChecker.typeToString(input),
        "Node :");
    // const s = input.symbol.valueDeclaration
    return ts.isArrayTypeNode(typeChecker.typeToTypeNode(input)!)
}


export function isArrayPropAccess(input: string) {
    return isArrayType(getTypeForPropertyAccess(input.split(".")))
}

type Meta = {
    isOptional?: boolean, isArray?: boolean,
    isObject?: boolean,
    numberAcess?: ts.Expression, stringAccess?: ts.Expression, identifier?: ts.Expression
}
type MetaValue = { name: string, meta: Meta }
export type ProcessThisResult = { g: string, v: string, values: MetaValue[], dynamicIdentifier?: MetaValue }

export function processThisStatement(exp: ts.PropertyAccessExpression | ts.ElementAccessExpression, arrayMut?: boolean): ProcessThisResult {
    console.log("processTHis Statemenut input : ", exp.getText(), "arrayArg", arrayMut);
    const values: MetaValue[] = [];
    let propIdentifier: Meta = {}
    const processInner = (input: ts.PropertyAccessExpression | ts.ElementAccessExpression = exp): ProcessThisResult => {
        if (ts.isPropertyAccessExpression(input)) {
            const parent = getNameofPropertyName(input.name)
            if (input.expression.kind === ts.SyntaxKind.ThisKeyword) {
                let v = parent
                let isObject = false;
                console.log("Parent2 : ", v, "values: ", values);
                if (values.length > 0) {
                    isObject = true
                    console.log("before splice : ", arrayMut, values);
                    if (!arrayMut) values.splice(0, 1)
                    console.log("after  splice : ", arrayMut, values);
                    if (values.length > 0) {
                        values.forEach(v => {
                            v.name = `${parent}.${v.name}`
                            if (v.meta.numberAcess || v.meta.identifier || arrayMut) {
                                v.meta.isArray = isArrayPropAccess(v.name)
                            }
                        })
                        v = values[0].name
                    }
                }
                const isArray = (propIdentifier.numberAcess || propIdentifier.identifier || arrayMut) ? isArrayPropAccess(parent) : false
                values.push({ name: parent, meta: { ...propIdentifier, isArray, isObject: !isArray && isObject } })
                const d = values.find((v, index) => v.meta.identifier)
                const result = { g: parent, v, values, dynamicIdentifier: d }
                console.log("processThisStatement Result :", result);
                return result
            }
            console.log("Processing parent : ", parent);
            values.forEach(v => {
                v.name = `${parent}.${v.name}`
            })
            values.push({ name: parent, meta: {} })
            return processInner(input.expression as any)
        } else if (ts.isNonNullExpression(input) && ts.isPropertyAccessExpression(input.expression)) {
            const parent = getNameofPropertyName(input.expression.name)
            console.log("Processing parent : ", parent);
            values.forEach(v => {
                v.name = `${parent}.${v.name}`
            })
            values.push({ name: parent, meta: { isOptional: true } })
            return processInner(input.expression.expression as any)
        }
        else if (ts.isPropertyAccessExpression(input.expression)
            && input.expression.expression.kind === ts.SyntaxKind.ThisKeyword
            && (ts.isElementAccessChain(input) || ts.isElementAccessExpression(input))) { //TODO this.prop[_] 
            propIdentifier = {}
            if (ts.isNumericLiteral(input.argumentExpression)) {
                propIdentifier.numberAcess = input.argumentExpression
            } else if (ts.isStringLiteral(input.argumentExpression)) {
                propIdentifier.stringAccess = input.argumentExpression
            } else {
                propIdentifier.identifier = input.argumentExpression
            }
            propIdentifier.isOptional = !!input.questionDotToken
            return processInner(input.expression as any)
        } else {
            const last = values[values.length - 1]
            if (ts.isNumericLiteral(input.argumentExpression)) {
                last.meta.numberAcess = input.argumentExpression
            } else if (ts.isStringLiteral(input.argumentExpression)) {
                last.meta.stringAccess = input.argumentExpression
            } else {
                last.meta.identifier = input.argumentExpression
            }
            if (ts.isElementAccessChain(input)) {
                if (input.questionDotToken) {
                    last.meta.isOptional = true
                }
                return processInner(input.expression as any)
            }
            if (input.questionDotToken) {
                last.meta.isOptional = true
            }

            return processInner(input.expression as any)
        }
    }
    return processInner(exp)
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