import * as ts from 'typescript';
import {
    getMethodsFromTypeMembers, getPropDeclsFromTypeMembers, getTypeName, getNameofPropertyName, groupByValue, isArrayMutatableAction
    , cleanUpGloabals, ProcessThisResult, processThisStatement, setClassDeclaration, getStateType, getActionType,
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




const getSwitchClauses = () => {

    const typeName = getTypeName()

    const methods = getMethodsFromTypeMembers()
    const propDecls = getPropDeclsFromTypeMembers()


    return methods.filter(m => m.body && m.body.statements.length > 0)
        .map(m => {
            const name = m.name.getText()
            const reservedStatements: string[] = [];
            const generalStatements: string[] = [];
            const parentGroups: Record<string, Map<string, ProcessThisResult["values"]>> = {};
            const PREFIX = "_tr_";
            const properyAssigments: string[] = []

            const addOrUpdateParentGroup = ({ g, v, values }: ProcessThisResult) => {

                const oldValue = parentGroups[g]
                if (!oldValue) {
                    const map = new Map()
                    parentGroups[g] = map.set(v, values)

                } else {
                    parentGroups[g] = oldValue.set(v, values)
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
                if (ts.isExpressionStatement(s)) {
                    if (text.startsWith("this.")) {
                        let gs = ""
                        if (ts.isPostfixUnaryExpression(s.expression)) {
                            const operand = s.expression.operand;
                            const result = processThisStatement(operand as any)
                            const vk = operand.getText().replace("this.", PREFIX)
                            if (result.dynamicIdentifier) { //TODO

                            } else {
                                addOrUpdateParentGroup(result)
                                if (s.expression.operator === ts.SyntaxKind.PlusPlusToken) {
                                    gs = `${vk} += 1`
                                } else {
                                    gs = `${vk} -= 1`
                                }
                            }
                        }
                        if (ts.isBinaryExpression(s.expression)) {
                            const left = s.expression.left
                            const result = processThisStatement(left as any)
                            const vk = left.getText().replace("this.", PREFIX)
                            if (result.dynamicIdentifier) { //TODO

                            } else {
                                addOrUpdateParentGroup(result)
                                gs = `${vk} = ${s.expression.right.getText()}`
                            }

                        }

                        if (ts.isCallExpression(s.expression) && ts.isPropertyAccessExpression(s.expression.expression) &&
                            isArrayMutatableAction(s.expression.expression.name)) {
                            const exp = s.expression.expression;
                            const vk = exp.getText().replace("this.", PREFIX)

                            const result = processThisStatement(exp.expression as any, true)
                            if (result.dynamicIdentifier) {//TODO 

                            } else {
                                addOrUpdateParentGroup(result)
                                gs = `${vk}(${s.expression.arguments.map(a => a.getText()).join(",")})`
                            }


                        }
                        generalStatements.push(gs)
                    }
                }
                else {
                    generalStatements.push(s.getText())
                }
            })

            // 
            Object.entries(parentGroups).forEach(([key, value], index) => {
                console.log("parent Group Entries: ", key, "Values : ", value);
                const keys = Array.from(value.keys())
                if (value.size === 1 && keys[0].split(".").length === 1) {
                    const a1 = value.get(keys[0])![0]
                    console.log("Single param : ", a1.meta);
                    let s = ""
                    const sk = `${PREFIX}${key}`
                    if (a1.meta.isArray) {
                        s = `let ${sk} = [...state.${key}]`
                    } else if (a1.meta.isObject) {
                        s = `let ${sk} = {...state.${key}}`
                    } else {
                        s = `let ${sk} = state.${key}`
                    }
                    reservedStatements.push(
                        s
                    )
                } else {
                    reservedStatements.push(
                        `let ${PREFIX}${key} = ${invalidateObjectWithList2({
                            input: value
                        })}`
                    )
                }
                properyAssigments.push(
                    `${key}:${PREFIX}${key}`
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
    { input: Map<string, ProcessThisResult["values"]>; traversed?: string[]; parent?: string })
    : string => {
    const entries = Array.from(input.entries())
    if (input.size === 1) {
        const [key, values] = entries[0]
        const v = traversed.length > 0 ? `${parent}.${traversed.join(".")}` : `${parent}`
        return invalidateObject2({ map: { input: key.split("."), values }, parent: v })
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

const convertToLietalExpand = (v: string, vt: ProcessThisResult["values"][0]) => {
    if (vt.meta.isArray) {
        if (vt.meta.numberAcess) {
            return `[...${v}.map((v,index) => index === ${vt.meta.numberAcess} ? {...v} : v)]`
        }
        return `[...${v}]`
    }
    else {
        return `{...${v}}`
    }
}

const invalidateObject2 = ({ map: { input, values }, traversed = [], parent = "state" }: { map: { input: string[], values: ProcessThisResult["values"] }; traversed?: string[]; parent?: string }):
    string => {
    console.log("Invalidatin object : input:  ", input, "traversed : ", traversed, "values: ", values, "aprent : ", parent);
    const v1 = input[0]
    const vv1 = traversed.length > 0 ? `${traversed.join(".")}.${v1}` : `${v1}`
    const v = traversed.length > 0 ? `${parent}.${traversed.join(".")}.${v1}` : `${parent}.${v1}`
    const v1t = values.find(v => v.name === vv1)!
    // const v1t: ProcessThisResult["values"][0] = { name: "", meta: { isOptional: false, isArray: false } }
    if (input.length === 1) {
        // if (v1t.meta.isOptional) {
        //     return ts.createConditional(
        //         ts.createIdentifier(v),
        //         convertToLietalExpand(v, v1t),
        //         ts.createIdentifier(v)
        //     )
        // } else {
        //     return convertToLietalExpand(v, v1t)
        // }
        return convertToLietalExpand(v, v1t)
    } else {
        const v2 = input[1]
        const vv2 = `${vv1}.${v2}`
        const v2t = values.find(v => v.name === vv2)!
        const v2exapnd = invalidateObject2({ map: { input: input.slice(1), values }, traversed: traversed.concat([v1]) })
        const expand = (v1t.meta.isArray) ?
            `[...${v}.map((v,index) => index === ${v1t.meta.numberAcess} ? {...v,${v2}:${v2exapnd}} : v)]`
            : `{ ...${v},${v2}:${v2exapnd} }`

        if (v2t.meta.isOptional) {
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


