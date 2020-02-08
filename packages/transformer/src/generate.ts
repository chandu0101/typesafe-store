import * as ts from 'typescript';
import {
    getMethodsFromTypeMembers, getPropDeclsFromTypeMembers, getTypeName, isArrayMutatableAction
    , cleanUpGloabals, ProcessThisResult, processThisStatement, setClassDeclaration, getStateType, getActionType, lastElementOfArray, MetaType,
} from './helpers';


export const createReducerFunction = (cd: ts.ClassDeclaration) => {

    setClassDeclaration(cd)
    const propDecls = getPropDeclsFromTypeMembers()
    const defaultState = getDefaultState(propDecls)
    const group = getTypeName()
    const clauses = getSwitchClauses()

    const f = buildFunction({ caseClauses: clauses, group })
    const result = ts.createIdentifier(
        `
         export type ${group}State = ${getStateType()}
         
         export type ${group}Action = ${getActionType()}

         export const ${group}ReducerGroup: ReducerGroup<${group}State,${group}Action,"${group}"> = { r: ${f},g:"${group}",ds:${defaultState},m:{}}

        `)
    cleanUpGloabals()
    return result;
}


type CallStatement = { group: string, exp: string, args: string }
type AssignStatement = { group: string, exprLeft: string, exprRight: string, op: string }
type GS = CallStatement | AssignStatement | string
type NewValue = { name: string, op: string, value: string }
const getSwitchClauses = () => {

    const typeName = getTypeName()

    const methods = getMethodsFromTypeMembers()
    const propDecls = getPropDeclsFromTypeMembers()


    return methods.filter(m => m.body && m.body.statements.length > 0)
        .map(m => {
            const name = m.name.getText()
            const reservedStatements: string[] = [];
            const generalStatements: GS[] = [];
            const parentGroups: Map<string, Map<string, [ProcessThisResult["values"], NewValue]>> = new Map()
            const PREFIX = "_tr_";
            const properyAssigments: string[] = []
            let duplicateExists = false
            let otherThanMutationStatements = false;

            const addOrUpdateParentGroup = ({ g, v, values }: ProcessThisResult, newValue: NewValue) => {

                const oldValue = parentGroups.get(g)
                if (!oldValue) {
                    const map = new Map()
                    parentGroups.set(g, map.set(v, [values, newValue]))

                } else {
                    if (oldValue.get(v)) {
                        duplicateExists = true
                    }
                    parentGroups.set(g, oldValue.set(v, [values, newValue]))
                }
            }
            const paramsLenth = m.parameters.length

            if (paramsLenth > 0) {
                let v = ""
                if (paramsLenth === 1) {
                    v = `const ${m.parameters[0].name.getText()} = (action as any).payload`
                } else {
                    v = `const { ${m.parameters.map(p => p.name.getText()).join(",")} } = (action as any).payload`
                }
                reservedStatements.push(v)
            }
            const statements = m.body!.statements
            statements.forEach(s => {
                const text = s.getText().trim()
                if (ts.isExpressionStatement(s) && text.startsWith("this.")) {
                    if (ts.isPostfixUnaryExpression(s.expression)) {
                        let op = ""
                        const operand = s.expression.operand;
                        const result = processThisStatement(operand as any)
                        const exprLeft = operand.getText()
                        const exprRight = "1"
                        let modifiedField = lastElementOfArray(exprLeft.split("."))
                        let newValue = { name: modifiedField, op: "=", value: "" }
                        const x = exprLeft.replace("this.", "state.")
                        if (s.expression.operator === ts.SyntaxKind.PlusPlusToken) {
                            op = "+="
                            newValue.value = `${x} + 1`
                        } else {
                            op = "-="
                            newValue.value = `${x} - 1`
                        }
                        addOrUpdateParentGroup(result, newValue)
                        generalStatements.push(`${exprLeft.replace("this.", PREFIX)} ${op} ${exprRight}`)
                    }
                    if (ts.isBinaryExpression(s.expression)) {
                        const left = s.expression.left
                        const result = processThisStatement(left as any)
                        const exprLeft = left.getText()
                        let exprRight = s.expression.right.getText()
                        const op = s.expression.operatorToken.getText()
                        let modifiedField = lastElementOfArray(exprLeft.split("."))
                        let newValue = { name: modifiedField, op: op, value: exprRight }

                        if (s.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                            newValue.value = exprRight
                        } else {
                            newValue.value = `${exprLeft.replace("this.", "")} ${op} ${exprRight}`
                        }
                        addOrUpdateParentGroup(result, newValue)
                        generalStatements.push(`${exprLeft.replace("this.", PREFIX)} ${op} ${exprRight}`)
                    }

                    if (ts.isCallExpression(s.expression) && ts.isPropertyAccessExpression(s.expression.expression) &&
                        isArrayMutatableAction(s.expression.expression.name)) {
                        const exp = s.expression.expression;
                        const result = processThisStatement(exp.expression as any, true)
                        let args = s.expression.arguments.map(a => a.getText()).join(",")
                        let modifiedField = lastElementOfArray(exp.expression.getText().split("."))
                        let newValue = { name: modifiedField, op: s.expression.expression.name.getText(), value: "" }
                        newValue.value = args
                        addOrUpdateParentGroup(result, newValue)
                        generalStatements.push(s.getText().replace("this.", PREFIX))
                    }

                }
                else {
                    otherThanMutationStatements = true
                    generalStatements.push(s.getText())
                }
            })


            if (!duplicateExists && !otherThanMutationStatements) {
                const parentGroupsSize = parentGroups.size
                const generalStatementsLength = generalStatements.length
                parentGroups.forEach((value, group) => {
                    // console.log("parent Group Entries: ", group, "Values : ", value);
                    // const key = Array.from(value.keys())[0]
                    // if (value.size === 1 && !key.includes(".")) {
                    //     const a1 = value.get(key)![0][0]
                    //     const newValue = value.get(key)![0][1]
                    //     console.log("Single param : ", a1.meta);
                    //     let s = ""
                    //     const sk = `${PREFIX}${group}`
                    //     if (a1.meta.isArray) {
                    //         properyAssigments.push(`${group}:[...state.${group}]${newValue}`)
                    //     } else if (a1.meta.isObject) {
                    //         properyAssigments.push(`${group}:[...state.${group}]${newValue}`)
                    //         s = `let ${sk} = {...state.${group}}`
                    //     } else {
                    //         s = `let ${sk} = state.${group}`
                    //     }
                    //     reservedStatements.push(
                    //         s
                    //     )
                    // } else {
                    //     reservedStatements.push(
                    //         `let ${PREFIX}${group} = ${invalidateObjectWithList2({
                    //             input: value
                    //         })}`
                    //     )
                    // }
                    properyAssigments.push(
                        `${group}:${invalidateObjectWithList({ input: value })}`
                    )

                })
                return `case "${name}" : {
                    ${reservedStatements.join("\n")}
                    return { ...state, ${properyAssigments.join(",")} }
                }`
            }
            // 
            parentGroups.forEach((value, group) => {
                console.log("parent Group Entries: ", group, "Values : ", value);
                const key = Array.from(value.keys())[0]
                if (value.size === 1 && !key.includes(".")) {
                    const a1 = value.get(key)![0][0]
                    console.log("Single param : ", a1.meta);
                    let s = ""
                    const sk = `${PREFIX}${group}`
                    if (a1.meta.type === MetaType.ARRAY) {
                        s = `let ${sk} = [...state.${group}]`
                    } else if (a1.meta.type === MetaType.OBJECT) {
                        s = `let ${sk} = {...state.${group}}`
                    } else {
                        s = `let ${sk} = state.${group}`
                    }
                    reservedStatements.push(
                        s
                    )
                } else {
                    reservedStatements.push(
                        `let ${PREFIX}${group} = ${invalidateObjectWithList2({
                            input: value
                        })}`
                    )
                }
                properyAssigments.push(
                    `${group}:${PREFIX}${group}`
                )
            })

            return `case "${name}" : {
                ${reservedStatements.join("\n")}
                ${generalStatements.join("\n")}
                return { ...state, ${properyAssigments.join(",")} }
            }`
        })
}



const invalidateObjectWithList2 = ({ input, traversed = [], parent = "state" }:
    { input: Map<string, [ProcessThisResult["values"], NewValue]>; traversed?: string[]; parent?: string })
    : string => {
    const entries = Array.from(input.entries())
    if (input.size === 1) {
        const [key, values] = entries[0]
        const v = traversed.length > 0 ? `${parent}.${traversed.join(".")}` : `${parent}`
        return invalidateObject2({ map: { input: key.split("."), values: values[0], newValue: values[1] }, parent: v })
    } else { //TODO multiple 
        return "TODO multiple entires of same object"
        // const v1 = entries[0][0].split(".")[0]
        // const props = groupByValue(input.filter(s => s.split(".").length > 1).map(s => {
        //     const a = s.split(".")
        //     return { key: a[1], value: a.slice(1).join(".") }
        // }), "key")
        // const v = traversed.length > 0 ? `${parent}.${traversed.join(".")}.${v1}` : `${parent}.${v1}`
        // return ts.createObjectLiteral([
        //     ts.createSpreadAssignment(ts.createIdentifier(v)),
        //     ...Object.keys(props).map(k =>
        //         ts.createPropertyAssignment(
        //             ts.createIdentifier(k),
        //             invalidateObjectWithList({ input: props[k], traversed: traversed.concat([v1]) })
        //         ))
        // ])
    }
}

const invalidateObject2 = ({ map: { input, values, newValue }, traversed = [], parent = "state" }: { map: { input: string[], values: ProcessThisResult["values"], newValue: NewValue }; traversed?: string[]; parent?: string }):
    string => {
    console.log("Invalidatin object : input:  ", input, "traversed : ", traversed, "values: ", values, "aprent : ", parent);
    const v1 = input[0]
    const vv1 = traversed.length > 0 ? `${traversed.join(".")}.${v1}` : `${v1}`
    const v = traversed.length > 0 ? `${parent}.${traversed.join(".")}.${v1}` : `${parent}.${v1}`
    const v1t = values.find(v => v.name === vv1)!
    // const v1t: ProcessThisResult["values"][0] = { name: "", meta: { isOptional: false, isArray: false } }
    if (input.length === 1) {
        if (v1t.meta.type === MetaType.ARRAY) {
            if (v1t.meta.access) {
                console.log("****** numberAcess found2 ");
                return `[...${v}.map((v,index) => index === ${v1t.meta.access[0].name} ? {...v} : v)]`
            }
            return `[...${v}]`
        }
        else {
            return `{...${v}}`
        }
    } else {
        const v2 = input[1]
        const vv2 = `${vv1}.${v2}`
        const v2t = values.find(v => v.name === vv2)!
        const v2exapnd = invalidateObject2({ map: { input: input.slice(1), values, newValue }, traversed: traversed.concat([v1]) })
        const expand = (v1t.meta.type === MetaType.ARRAY) ?
            `[...${v}.map((v,index) => index === ${v1t.meta.access?.[0].name} ? {...v,${v2}:${v2exapnd}} : v)]`
            : `{ ...${v},${v2}:${v2exapnd} }`

        if (v2t.meta.isOptional) {
            return `${v} ? ${expand} : ${v}`
        }
        return expand
    }
}

const invalidateObjectWithList = ({ input, traversed = [], parent = "state" }:
    { input: Map<string, [ProcessThisResult["values"], NewValue]>; traversed?: string[]; parent?: string })
    : string => {
    const entries = Array.from(input.entries())
    if (input.size === 1) {
        const [key, values] = entries[0]
        const v = traversed.length > 0 ? `${parent}.${traversed.join(".")}` : `${parent}`
        return invalidateObject({ map: { input: key.split("."), values: values[0], newValue: values[1] }, parent: v })
    } else { //TODO multiple 
        return "TODO multiple entires of same object"
        // const v1 = entries[0][0].split(".")[0]
        // const props = groupByValue(input.filter(s => s.split(".").length > 1).map(s => {
        //     const a = s.split(".")
        //     return { key: a[1], value: a.slice(1).join(".") }
        // }), "key")
        // const v = traversed.length > 0 ? `${parent}.${traversed.join(".")}.${v1}` : `${parent}.${v1}`
        // return ts.createObjectLiteral([
        //     ts.createSpreadAssignment(ts.createIdentifier(v)),
        //     ...Object.keys(props).map(k =>
        //         ts.createPropertyAssignment(
        //             ts.createIdentifier(k),
        //             invalidateObjectWithList({ input: props[k], traversed: traversed.concat([v1]) })
        //         ))
        // ])
    }
}

const invalidateObject = ({ map: { input, values, newValue }, traversed = [], parent = "state" }: { map: { input: string[], values: ProcessThisResult["values"], newValue: NewValue }; traversed?: { name: string, access?: string }[]; parent?: string }):
    string => {
    console.log("Invalidatin object : input:  ", input, "traversed : ", traversed, "values: ", values, "aprent : ", parent);
    const v1 = input[0]
    const vv1 = traversed.length > 0 ? `${traversed.map(t => t.name).join(".")}.${v1}` : `${v1}`
    const v = traversed.length > 0 ? `${parent}.${traversed.map(t => t.access ? `${t.name}${t.access}` : t.name).join(".")}.${v1}` : `${parent}.${v1}`
    const v1t = values.find(v => v.name === vv1)!
    console.log("v:", v, "v1t:", v1t);
    // const v1t: ProcessThisResult["values"][0] = { name: "", meta: { isOptional: false, isArray: false } }
    if (input.length === 1) {
        if (traversed.length === 0 && v1t.meta.type === MetaType.UNKNOWN) {
            return newValue.value
        } else {
            if (v1t.meta.type === MetaType.ARRAY) {
                let result = ""
                if (v1t.meta.access) {
                    console.log("****** numberAcess found1 ", v1t.meta.isOptional);
                    const a = v1t.meta.access[0].name
                    let obs = `{...v,${newValue.name}:${newValue.value}}`
                    if (v1t.meta.isOptional) {
                        obs = `v ? ${obs} : v`
                    }
                    const result = `[...${v}.map((v,_i) => _i === ${a} ? ${obs} : v)]`
                    console.log("result : ", result);
                    return result;
                } else {
                    const op = newValue.op
                    const args = newValue.value
                    switch (op) {
                        case "push": {
                            result = `${v}.concat(${args})`
                            break;
                        }
                        case "pop": {
                            result = `${v}.slice(0,-1)`
                            break;
                        }
                        case "splice": {
                            const a = args.split(",")
                            if (a.length === 1) {
                                result = `[...${v}.slice(0,${a[0]})]`
                            } else if (a.length == 2) {
                                result = `[...${v}.slice(0,${a[0]}),...${v}.slice(${parseInt(a[0], 10) + parseInt(a[1], 10)})]`
                            } else {
                                result = `[...${v}.slice(0,${a[0]}),${["..." + a[2]]},...${v}.slice(${parseInt(a[0], 10) + parseInt(a[1], 10)})]`
                            }
                            break;
                        }
                        default:
                            result = `[...${v}].${op}(${args})`

                    }
                    if (v1t.meta.isOptional) {
                        return `${v} ? ${result} : ${v}`
                    }
                    return result;
                }

            }
            else {
                const r = `{...${v},${newValue.name}:${newValue.value}}`
                if (v1t.meta.isOptional) {
                    console.log(`Optional found1 : ,v1 = ${v1}, v = ${v}`);
                    return `${v} ? ${r} : ${v}`
                }
                return r;
            }
        }
    } else {
        const v2 = input[1]
        const v2t = values.find(v => v.name === vv1)!
        let access = v1t.meta.access?.[0].name || undefined
        if (v1t.meta.isOptional) {
            access = access ? `![${access}]` : "!"
        }
        const v2exapnd = invalidateObject({ map: { input: input.slice(1), values, newValue }, traversed: traversed.concat([{ name: v1, access }]) })
        console.log(`v2 expand : `, v2exapnd);
        let expand = ""
        if (v1t.meta.type === MetaType.ARRAY) {
            let obs = `{...v,${v2}:${v2exapnd}}`
            if (v1t.meta.isOptional) {
                obs = `v ? ${obs} : v`
            }
            expand = `[...${v}.map((v,_i) => _i === ${v1t.meta.access?.[0]} ? ${obs} : v)]`
        } else {
            expand = `{ ...${v},${v2}:${v2exapnd} }`
            if (v1t.meta.isOptional) {
                expand = `${v} ? ${expand} : ${v}`
            }
        }
        if (v2t.meta.isOptional) {
            console.log(`Optional found2 : ,v2 = ${v2}, v = ${v}`);
            return `${v} ? ${expand} : ${v}`
        }
        return expand
    }
}

const getDefaultState = (props: ts.PropertyDeclaration[]) => {
    return `{${props.filter(p => p.initializer)
        .map(p => `${p.name.getText()}:${p.initializer!.getText()}`)}}`
}


function buildFunction({ caseClauses, group }: { caseClauses: string[], group: string }) {

    return `
      (state:${group}State,action:${group}Action) => {
         const t = action.name
         switch(t) {
           ${caseClauses.join("\n")}
         }
      }
    `
}


