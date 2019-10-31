import * as ts from 'typescript';
import { getMembersofTypeNode, getMethodsFromTypeMembers, getPropDeclsFromTypeMembers, getTypeName, getNameofPropertyName, groupByValue, replaceThisIdentifier, isPushStatement, getMembers, } from './helpers';
import { stringify } from 'querystring';


export let typeChecker: ts.TypeChecker = null as any

export let typeNode: ts.TypeNode = null as any


export function setTypeCheckerAndNode(tc: ts.TypeChecker, tn: ts.TypeNode) {
    typeChecker = tc;
}
export function getTypeChecker() {
    return typeChecker;
}

export function getTypeNode() {
    return typeNode;
}

export const createReducerFunction = ({ type, typeChecker }: { type: ts.TypeNode; typeChecker: ts.TypeChecker; }) => {

    setTypeCheckerAndNode(typeChecker, type);

    const members = getMembers()

    const typeName = getTypeName()

    const propDecls = getPropDeclsFromTypeMembers(members)

    const defaultState = getDefaultState(propDecls)

    const clauses = getSwitchClauses({ members, typeChecker, typeName })


    return buildFunction({ caseClauses: clauses, defaultState })
}



const getSwitchClauses = ({ members, typeChecker, typeName }: { members: ts.Symbol[]; typeChecker: ts.TypeChecker; typeName: string; }) => {

    const methods = getMethodsFromTypeMembers(members)
    const propDecls = getPropDeclsFromTypeMembers(members)


    return methods.filter(m => m.body && m.body.statements.length > 0)
        .map(m => {
            const name = getNameofPropertyName(m.name)
            const sname = `${typeName}.${name}`

            const reservedStatements: ts.Statement[] = [];
            const generalStatements: ts.Statement[] = [];
            const parentGroups: Record<string, Set<string>> = {};
            const PREFIX = "_tr_";
            const properyAssigments: ts.PropertyAssignment[] = []

            const addOrUpdateParentGroup = (input: string, isArrayPush: boolean = false) => {
                let inputProcessed = input.trim().replace("this.", "")
                const a = inputProcessed.split(".")
                const s = a[0];
                if (isArrayPush) {
                    inputProcessed += "[]"
                }
                const oldValue = parentGroups[s]
                if (!oldValue) {
                    parentGroups[s] = new Set([inputProcessed])

                } else {
                    parentGroups[s] = oldValue.add(inputProcessed)
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
                            if (s.expression.operator === ts.SyntaxKind.PlusPlusToken) {
                                const textWithoutplus = text.replace("++", "")
                                addOrUpdateParentGroup(textWithoutplus)
                                generalStatements.push(
                                    ts.createExpressionStatement(ts.createBinary(
                                        replaceThisIdentifier(s.expression.operand as any, PREFIX),
                                        ts.createToken(ts.SyntaxKind.PlusEqualsToken),
                                        ts.createNumericLiteral("1")
                                    ))
                                )
                            } else {
                                const textWithoutMinus = text.replace("--", "")
                                addOrUpdateParentGroup(textWithoutMinus)
                                generalStatements.push(
                                    ts.createExpressionStatement(ts.createBinary(
                                        replaceThisIdentifier(s.expression.operand as any, PREFIX),
                                        ts.createToken(ts.SyntaxKind.MinusEqualsToken),
                                        ts.createNumericLiteral("1")
                                    ))
                                )
                            }

                        }
                        if (ts.isBinaryExpression(s.expression)) {
                            const leftText = s.expression.left.getText()
                            addOrUpdateParentGroup(leftText)
                            generalStatements.push(
                                ts.createExpressionStatement(ts.createBinary(
                                    replaceThisIdentifier(s.expression.left as any, PREFIX),
                                    s.expression.operatorToken,
                                    s.expression.right
                                )
                                )
                            )
                        }

                        if (ts.isCallExpression(s.expression) && isPushStatement(s)) {

                            addOrUpdateParentGroup(s.expression.expression.getText(), true)
                            generalStatements.push(
                                ts.createExpressionStatement(
                                    ts.createCall(replaceThisIdentifier(s.expression.expression as any, PREFIX),
                                        undefined,
                                        s.expression.arguments)
                                )
                            )

                        }

                    }
                }
                else {
                    generalStatements.push(s)
                }
            })




            // 
            Object.entries(parentGroups).forEach(([key, value], index) => {
                const a = Array.from(value).filter(v => v.trim().length > 1)
                if (a.length === 1 && a[0].split(".").length === 1) {
                    const a1 = a[0][0]
                    reservedStatements.push(
                        ts.createVariableStatement(
                            undefined,
                            ts.createVariableDeclarationList(
                                [ts.createVariableDeclaration(
                                    ts.createIdentifier(`${PREFIX}${key}`),
                                    undefined,
                                    a1.endsWith("[]") ? ts.createArrayLiteral([
                                        ts.createSpread(ts.createPropertyAccess(
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
                    const input = Array.from(new Set(a.map(s => {
                        const sa = s.split(".")
                        if (sa.length > 1 && !sa[sa.length - 1].endsWith("]")) {
                            sa.pop()
                        }
                        return sa.join(".")
                    })))
                    reservedStatements.push(
                        ts.createVariableStatement(
                            undefined,
                            ts.createVariableDeclarationList(
                                [ts.createVariableDeclaration(
                                    ts.createIdentifier(`${PREFIX}${key}`),
                                    undefined,
                                    invalidateObjectWithList({
                                        input
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




const invalidateObject = ({ input, traversed = [], parent = "state" }: { input: string[]; traversed?: string[]; parent?: string }): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression => {
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




function buildFunction({ caseClauses, defaultState }: { caseClauses: ts.CaseClause[]; defaultState: ts.Expression; }) {

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
                defaultState
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



