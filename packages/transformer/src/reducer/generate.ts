import * as ts from 'typescript';
import {
    getMembersofTypeNode, getMethodsFromTypeMembers, getPropDeclsFromTypeMembers, getTypeName, getNameofPropertyName, groupByValue, replaceThisIdentifier, isArrayMutatableAction
    , setTypeCheckerAndNode, cleanUpGloabals, ProcessThisResult, processThisStatement,
} from './helpers';
import { stringify } from 'querystring';




export const createReducerFunction = ({ type, typeChecker }: { type: ts.TypeNode; typeChecker: ts.TypeChecker; }) => {

    setTypeCheckerAndNode(typeChecker, type);

    const propDecls = getPropDeclsFromTypeMembers()
    const defaultState = getDefaultState(propDecls)
    const group = getTypeName()
    const clauses = getSwitchClauses()

    cleanUpGloabals()
    const f = buildFunction({ caseClauses: clauses })
    return ts.createObjectLiteral(
        [
            ts.createPropertyAssignment(
                ts.createIdentifier("r"),
                f
            ),
            ts.createPropertyAssignment(
                ts.createIdentifier("g"),
                ts.createStringLiteral(group)
            ),
            ts.createPropertyAssignment(
                ts.createIdentifier("ds"),
                defaultState
            ),
            ts.createPropertyAssignment(
                ts.createIdentifier("m"),
                ts.createObjectLiteral(
                    [],
                    false
                )
            )
        ]
    )
}



const getSwitchClauses = () => {

    const typeName = getTypeName()

    const methods = getMethodsFromTypeMembers()
    const propDecls = getPropDeclsFromTypeMembers()


    return methods.filter(m => m.body && m.body.statements.length > 0)
        .map(m => {
            const name = getNameofPropertyName(m.name)
            const sname = `${typeName}.${name}`

            const reservedStatements: ts.Statement[] = [];
            const generalStatements: ts.Statement[] = [];
            const parentGroups: Record<string, Map<string, ProcessThisResult["values"]>> = {};
            const PREFIX = "_tr_";
            const properyAssigments: ts.PropertyAssignment[] = []

            const addOrUpdateParentGroup = ({ g, v, values }: ProcessThisResult) => {

                const oldValue = parentGroups[g]
                if (!oldValue) {
                    const map = new Map()
                    parentGroups[g] = map.set(v, values)

                } else {
                    parentGroups[g] = oldValue.set(v, values)
                }
            }


            if (m.parameters.length === 1) {
                const s = ts.createVariableStatement(
                    undefined,
                    ts.createVariableDeclarationList(
                        [ts.createVariableDeclaration(
                            m.parameters[0].name,
                            undefined,
                            ts.createPropertyAccess(
                                ts.createIdentifier("action"),
                                ts.createIdentifier("payload")
                            )
                        )],
                        ts.NodeFlags.Const
                    )
                )
                reservedStatements.push(s)
            }
            const statements = m.body!.statements
            statements.forEach(s => {
                const text = s.getText().trim()
                if (ts.isExpressionStatement(s)) {
                    if (text.startsWith("this.")) {
                        if (ts.isPostfixUnaryExpression(s.expression)) {
                            const operand = s.expression.operand;
                            const result = processThisStatement(operand as any)
                            if (result.dynamicIdentifier) { //TODO

                            } else {
                                addOrUpdateParentGroup(result)
                                if (s.expression.operator === ts.SyntaxKind.PlusPlusToken) {
                                    generalStatements.push(
                                        ts.createExpressionStatement(ts.createBinary(
                                            replaceThisIdentifier(s.expression.operand as any, PREFIX),
                                            ts.createToken(ts.SyntaxKind.PlusEqualsToken),
                                            ts.createNumericLiteral("1")
                                        ))
                                    )
                                } else {
                                    generalStatements.push(
                                        ts.createExpressionStatement(ts.createBinary(
                                            replaceThisIdentifier(operand as any, PREFIX),
                                            ts.createToken(ts.SyntaxKind.MinusEqualsToken),
                                            ts.createNumericLiteral("1")
                                        ))
                                    )
                                }
                            }


                        }
                        if (ts.isBinaryExpression(s.expression)) {
                            const left = s.expression.left
                            if (name === "chnagePersonName") {

                            }
                            const result = processThisStatement(left as any)
                            if (name === "chnagePersonName") {
                                console.log("Result for chnagePersonName: ", result.g, result.v, result.values, " Text:", text);
                            }
                            if (result.dynamicIdentifier) { //TODO

                            } else {
                                addOrUpdateParentGroup(result)
                                generalStatements.push(
                                    ts.createExpressionStatement(ts.createBinary(
                                        replaceThisIdentifier(left as any, PREFIX),
                                        s.expression.operatorToken,
                                        s.expression.right
                                    )
                                    )
                                )
                            }

                        }

                        if (ts.isCallExpression(s.expression) && ts.isPropertyAccessExpression(s.expression.expression) &&
                            isArrayMutatableAction(s.expression.expression.name)) {
                            const exp = s.expression.expression;
                            const result = processThisStatement(exp.expression as any, true)
                            if (result.dynamicIdentifier) {//TODO 

                            } else {
                                addOrUpdateParentGroup(result)
                                generalStatements.push(
                                    ts.createExpressionStatement(
                                        ts.createCall(replaceThisIdentifier(exp as any, PREFIX),
                                            undefined,
                                            s.expression.arguments)
                                    )
                                )
                            }


                        }

                    }
                }
                else {
                    generalStatements.push(s)
                }
            })




            // 
            Object.entries(parentGroups).forEach(([key, value], index) => {
                console.log("parent Group Entries: ", key, "Values : ", value);
                const keys = Array.from(value.keys())
                if (value.size === 1 && keys[0].split(".").length === 1) {
                    const a1 = value.get(keys[0])![0]
                    console.log("Single param : ", a1.meta);
                    reservedStatements.push(
                        ts.createVariableStatement(
                            undefined,
                            ts.createVariableDeclarationList(
                                [ts.createVariableDeclaration(
                                    ts.createIdentifier(`${PREFIX}${key}`),
                                    undefined,
                                    a1.meta.isArray ? ts.createArrayLiteral([
                                        ts.createSpread(ts.createPropertyAccess(
                                            ts.createIdentifier("state"),
                                            ts.createIdentifier(key)
                                        ))
                                    ]) : a1.meta.isObject ?
                                            ts.createObjectLiteral([
                                                ts.createSpreadAssignment(ts.createPropertyAccess(
                                                    ts.createIdentifier("state"),
                                                    ts.createIdentifier(key)
                                                ))
                                            ]) : ts.createPropertyAccess(
                                                ts.createIdentifier("state"),
                                                ts.createIdentifier(key)
                                            )
                                )],
                                ts.NodeFlags.Let
                            )
                        )
                    )
                } else {
                    // const input = Array.from(new Set(a.map(s => {
                    //     const sa = s.split(".")
                    //     if (sa.length > 1 && !sa[sa.length - 1].endsWith("]")) {
                    //         sa.pop()
                    //     }
                    //     return sa.join(".")
                    // })))
                    reservedStatements.push(
                        ts.createVariableStatement(
                            undefined,
                            ts.createVariableDeclarationList(
                                [ts.createVariableDeclaration(
                                    ts.createIdentifier(`${PREFIX}${key}`),
                                    undefined,
                                    invalidateObjectWithList2({
                                        input: value
                                    })
                                )],
                                ts.NodeFlags.Let
                            )
                        )
                    )

                }

                properyAssigments.push(
                    ts.createPropertyAssignment(
                        ts.createIdentifier(key),
                        ts.createIdentifier(`${PREFIX}${key}`)
                    )
                )

            })


            return ts.createCaseClause(
                ts.createStringLiteral(sname),
                [ts.createBlock(
                    [
                        ...reservedStatements,
                        ...generalStatements,
                        ts.createReturn(ts.createObjectLiteral(
                            [
                                ts.createSpreadAssignment(ts.createIdentifier("state")),
                                ...properyAssigments
                            ],
                            false
                        ))
                    ],
                    true
                )]
            )
        })
}


const getPropertyAssignments = () => {

}

const isPostfixUnaryExpression = (s: ts.Statement) => {
    return ts.isExpressionStatement(s) && ts.isPostfixUnaryExpression(s)
}

const isThisBinaryEqualExpressionStatement = (s: ts.Statement) => {
    if (ts.isExpressionStatement(s)) {
        if (ts.isBinaryExpression(s.expression) && s.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
            const text = s.getText().trim();
            if (text.startsWith("this.")) {
                return {
                    exp: text.replace("this.", "").split("=")[0].trim(),
                    identifier: s.expression.right.getText().trim().replace("this.", "state.")
                }
            }

        }
    }

}


const invalidateObjectWithList = ({ input, traversed = [], parent = "state" }: { input: string[]; traversed?: string[]; parent?: string }): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression => {
    if (input.length === 1) {
        const v = traversed.length > 0 ? `${parent}.${traversed.join(".")}` : `${parent}`
        return invalidateObject({ input: input[0].split("."), parent: v })
    } else {
        const v1 = input[0].split(".")[0]
        const props = groupByValue(input.filter(s => s.split(".").length > 1).map(s => {
            const a = s.split(".")
            return { key: a[1], value: a.slice(1).join(".") }
        }), "key")
        const v = traversed.length > 0 ? `${parent}.${traversed.join(".")}.${v1}` : `${parent}.${v1}`
        return ts.createObjectLiteral([
            ts.createSpreadAssignment(ts.createIdentifier(v)),
            ...Object.keys(props).map(k =>
                ts.createPropertyAssignment(
                    ts.createIdentifier(k),
                    invalidateObjectWithList({ input: props[k], traversed: traversed.concat([v1]) })
                ))
        ])
    }
}


const invalidateObjectWithList2 = ({ input, traversed = [], parent = "state" }:
    { input: Map<string, ProcessThisResult["values"]>; traversed?: string[]; parent?: string })
    : ts.ObjectLiteralExpression | ts.ArrayLiteralExpression | ts.ConditionalExpression => {
    const entries = Array.from(input.entries())
    if (input.size === 1) {
        const [key, values] = entries[0]
        const v = traversed.length > 0 ? `${parent}.${traversed.join(".")}` : `${parent}`
        return invalidateObject2({ map: { input: key.split("."), values }, parent: v })
    } else {
        return null as any
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
            return ts.createArrayLiteral(
                [ts.createSpread(ts.createCall(
                    ts.createPropertyAccess(
                        ts.createIdentifier(v),
                        ts.createIdentifier("map")
                    ),
                    undefined,
                    [ts.createArrowFunction(
                        undefined,
                        undefined,
                        [
                            ts.createParameter(
                                undefined,
                                undefined,
                                undefined,
                                ts.createIdentifier("v"),
                                undefined,
                                undefined,
                                undefined
                            ),
                            ts.createParameter(
                                undefined,
                                undefined,
                                undefined,
                                ts.createIdentifier("index"),
                                undefined,
                                undefined,
                                undefined
                            )
                        ],
                        undefined,
                        ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                        ts.createConditional(
                            ts.createBinary(
                                vt.meta.numberAcess,
                                ts.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                ts.createIdentifier("index")
                            ),
                            ts.createObjectLiteral(
                                [ts.createSpreadAssignment(ts.createIdentifier("v"))],
                                false
                            ),
                            ts.createIdentifier("v")
                        )
                    )]
                ))],
                false
            )
        }
        return ts.createArrayLiteral([
            ts.createSpread(ts.createIdentifier(v))
        ])
    }
    else {
        return ts.createObjectLiteral([
            ts.createSpreadAssignment(ts.createIdentifier(v))
        ])
    }
}

const invalidateObject2 = ({ map: { input, values }, traversed = [], parent = "state" }: { map: { input: string[], values: ProcessThisResult["values"] }; traversed?: string[]; parent?: string }):
    ts.ObjectLiteralExpression | ts.ArrayLiteralExpression | ts.ConditionalExpression => {
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
            ts.createArrayLiteral(
                [ts.createSpread(ts.createCall(
                    ts.createPropertyAccess(
                        ts.createIdentifier(v),
                        ts.createIdentifier("map")
                    ),
                    undefined,
                    [ts.createArrowFunction(
                        undefined,
                        undefined,
                        [
                            ts.createParameter(
                                undefined,
                                undefined,
                                undefined,
                                ts.createIdentifier("v"),
                                undefined,
                                undefined,
                                undefined
                            ),
                            ts.createParameter(
                                undefined,
                                undefined,
                                undefined,
                                ts.createIdentifier("index"),
                                undefined,
                                undefined,
                                undefined
                            )
                        ],
                        undefined,
                        ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                        ts.createConditional(
                            ts.createBinary(
                                v1t.meta.numberAcess!,
                                ts.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                                ts.createIdentifier("index")
                            ),
                            ts.createObjectLiteral(
                                [ts.createSpreadAssignment(ts.createIdentifier("v")),
                                ts.createPropertyAssignment(
                                    ts.createIdentifier(v2),
                                    v2exapnd
                                )

                                ],
                                false
                            ),
                            ts.createIdentifier("v")
                        )
                    )]
                ))],
                false
            )
            : ts.createObjectLiteral([
                ts.createSpreadAssignment(ts.createIdentifier(v)),
                ts.createPropertyAssignment(
                    ts.createIdentifier(v2),
                    v2exapnd
                ),
            ])
        if (v2t.meta.isOptional) {
            return ts.createConditional(
                ts.createIdentifier(v),
                expand,
                ts.createIdentifier(v)
            )
        }
        return expand
    }
}



const invalidateObject = ({ input, traversed = [], parent = "state" }: { input: string[]; traversed?: string[]; parent?: string }): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression => {
    console.log("Invalidatin object : input:  ", input, "traversed : ");
    const v1 = input[0]
    const v = traversed.length > 0 ? `${parent}.${traversed.join(".")}.${v1}` : `${parent}.${v1}`
    if (input.length === 1) {
        return ts.createObjectLiteral([
            ts.createSpreadAssignment(ts.createIdentifier(v))
        ])
    } else {
        const v2 = input[1]
        return ts.createObjectLiteral([
            ts.createSpreadAssignment(ts.createIdentifier(v)),
            ts.createPropertyAssignment(
                ts.createIdentifier(v2),
                invalidateObject({ input: input.slice(1), traversed: traversed.concat([v1]) })
            ),
        ])
    }
}

const convertPostFixUnaryToPropertyAssignment = ({ input, increment, traversed = [] }: { input: string[]; increment: boolean; traversed?: string[]; }): ts.PropertyAssignment => {
    const v1 = input[0]
    const v = traversed.length > 0 ? `state.${traversed.join(".")}.${v1}` : `state.${v1}`
    if (input.length === 1) {
        return ts.createPropertyAssignment(
            ts.createIdentifier(v1),
            ts.createBinary(
                ts.createIdentifier(v),
                increment ? ts.createToken(ts.SyntaxKind.PlusToken) : ts.createToken(ts.SyntaxKind.MinusToken),
                ts.createNumericLiteral("1")
            )
        )
    } else {
        return ts.createPropertyAssignment(
            ts.createIdentifier(v1),
            ts.createObjectLiteral([
                ts.createSpreadAssignment(ts.createIdentifier(v)),
                convertPostFixUnaryToPropertyAssignment({ input: input.slice(1), increment, traversed: traversed.concat([v1]) })
            ])
        )
    }
}
const convertBinaryEqualsToPropertyAssignment = ({ input, identifier, traversed = [] }: { input: string[]; identifier: string; traversed?: string[]; }): ts.PropertyAssignment => {
    const v1 = input[0]
    const v = traversed.length > 0 ? `state.${traversed.join(".")}.${v1}` : `state.${v1}`
    if (input.length === 1) {
        return ts.createPropertyAssignment(
            ts.createIdentifier(v1),
            ts.createIdentifier(identifier)
        )
    } else {
        return ts.createPropertyAssignment(
            ts.createIdentifier(v1),
            ts.createObjectLiteral([
                ts.createSpreadAssignment(ts.createIdentifier(v)),
                convertBinaryEqualsToPropertyAssignment({ input: input.slice(1), identifier, traversed: traversed.concat([v1]) })
            ])
        )
    }

}


const getDefaultState = (props: ts.PropertyDeclaration[]) => {

    return ts.createObjectLiteral(props.filter(p => p.initializer)
        .map(p => ts.createPropertyAssignment(p.name, p.initializer!)))

}




function buildFunction({ caseClauses, }: { caseClauses: ts.CaseClause[]; }) {

    return ts.createArrowFunction(
        undefined,
        undefined,
        [
            ts.createParameter(
                undefined,
                undefined,
                undefined,
                ts.createIdentifier("state"),
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                undefined
            ),
            ts.createParameter(
                undefined,
                undefined,
                undefined,
                ts.createIdentifier("action"),
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                undefined
            )
        ],
        undefined,
        ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        ts.createBlock(
            [
                ts.createVariableStatement(
                    undefined,
                    ts.createVariableDeclarationList(
                        [ts.createVariableDeclaration(
                            ts.createIdentifier("t"),
                            undefined,
                            ts.createTemplateExpression(
                                ts.createTemplateHead(
                                    "",
                                    ""
                                ),
                                [
                                    ts.createTemplateSpan(
                                        ts.createPropertyAccess(
                                            ts.createIdentifier("action"),
                                            ts.createIdentifier("group")
                                        ),
                                        ts.createTemplateMiddle(
                                            ".",
                                            "."
                                        )
                                    ),
                                    ts.createTemplateSpan(
                                        ts.createPropertyAccess(
                                            ts.createIdentifier("action"),
                                            ts.createIdentifier("name")
                                        ),
                                        ts.createTemplateTail(
                                            "",
                                            ""
                                        )
                                    )
                                ]
                            )
                        )],
                        ts.NodeFlags.Const
                    )
                ),
                ts.createSwitch(
                    ts.createIdentifier("t"),
                    ts.createCaseBlock([
                        ...caseClauses,
                        ts.createDefaultClause([ts.createReturn(ts.createIdentifier("state"))])
                    ])
                )],
            true
        )
    )
}


export function createImmerReducerFunction(caseClauses: ts.CaseClause[]) {

    return ts.createArrowFunction(
        undefined,
        undefined,
        [
            ts.createParameter(
                undefined,
                undefined,
                undefined,
                ts.createIdentifier("state"),
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                undefined
            ),
            ts.createParameter(
                undefined,
                undefined,
                undefined,
                ts.createIdentifier("action"),
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                undefined
            )
        ],
        undefined,
        ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        ts.createBlock(
            [
                ts.createVariableStatement(
                    undefined,
                    ts.createVariableDeclarationList(
                        [ts.createVariableDeclaration(
                            ts.createIdentifier("t"),
                            undefined,
                            ts.createTemplateExpression(
                                ts.createTemplateHead(
                                    "",
                                    ""
                                ),
                                [
                                    ts.createTemplateSpan(
                                        ts.createPropertyAccess(
                                            ts.createIdentifier("action"),
                                            ts.createIdentifier("group")
                                        ),
                                        ts.createTemplateMiddle(
                                            ".",
                                            "."
                                        )
                                    ),
                                    ts.createTemplateSpan(
                                        ts.createPropertyAccess(
                                            ts.createIdentifier("action"),
                                            ts.createIdentifier("name")
                                        ),
                                        ts.createTemplateTail(
                                            "",
                                            ""
                                        )
                                    )
                                ]
                            )
                        )],
                        ts.NodeFlags.Const
                    )
                ),
                ts.createSwitch(
                    ts.createIdentifier("t"),
                    ts.createCaseBlock([
                        ...caseClauses,
                        ts.createDefaultClause([ts.createReturn(ts.createIdentifier("state"))])
                    ])
                )],
            true
        )
    )
}



