import * as ts from "typescript";
import {
    LocalPropertyDecls, EAccess, MetaValue, Meta, ReducersMeta, AsyncTypes, TypeSafeStoreConfig, TypeSafeStoreConfigExtra, HttpUrlConfig,
    MetaType, NewValue, GS, ProcessThisResult
} from "../types";
import {
    T_STORE_ASYNC_TYPE, REDUCERS_FOLDER, GENERATED_FOLDER,
    TSTORE_TEMP_V, EMPTY_REDUCER_TRANFORM_MESSAGE, GEN_SUFFIX
} from "../constants";
import { sep, relative } from "path";
import { ConfigUtils } from "../utils/config-utils";
import { AstUtils } from "../utils/ast-utils";
import { FileUtils } from "../utils/file-utils";
import { CommonUtils } from "../utils/common-utils";
import { performance } from "perf_hooks"
import { isUnionType } from "tsutils/typeguard/type"
import chalk = require("chalk");




const STATE_PARAM_NAME = "_trg_satate"

const PAYLOAD_VARIABLE_NAME = "_trg_payload"

let classDecl: ts.ClassDeclaration = null as any;

let members: ts.NodeArray<ts.ClassElement> = null as any;

let memberTypes: { name: string; type: ts.Type }[] = null as any;

let propDecls: LocalPropertyDecls[] = null as any;

let currentProcessingReducerFile: string = ""

let globalMeta: Map<string, ReducersMeta> = new Map()

let arrayMutableMethods = [
    "push",
    "pop",
    "fill",
    "copyWithin",
    "shift",
    "sort",
    "splice",
    "unshift"
];

class Sample {
    s: number = 2
    s1: { name: string } = { name: '' }
    checkIt() {
        delete this.s
        delete this.s1.name
    }
}

function transformFile(file: string) {
    try {
        console.log("transforming file : ", file);
        const t0 = performance.now();
        setCurrentProcessingReducerFile(file)
        const sf = AstUtils.getSourceFile(file)!;
        const printer = ts.createPrinter();
        const newSf = ts.transform(sf, [reducerTransformer]).transformed[0];
        const transformedContent = printer.printFile(newSf)
        let imports: string[] = []
        if (!transformedContent.includes(EMPTY_REDUCER_TRANFORM_MESSAGE)) {
            imports.push(`import { ReducerGroup,FetchVariants,PromiseData } from "@typesafe-store/store"`)
        }
        const output = `
           ${CommonUtils.dontModifyMessage()}
           ${imports.join("\n")}
           ${transformedContent}
          `;
        const outFile = ConfigUtils.getOutputPathForReducerSourceFile(file)
        console.log("******* writing to out file : ", outFile);
        console.log("outFile : ", outFile);
        FileUtils.writeFileSync(outFile, output);
        const t1 = performance.now();
        console.log("time : ", t1 - t0, " ms");
    } catch (error) {
        console.info(chalk.red(`Error processing file : ${relative(".", file)} : ${error}`))
    }

}

export function transformReducerFiles(files: string[]) {
    console.log("transforming files: ", files);
    files.forEach(f => {
        transformFile(f);
    });
}




const reducerTransformer: ts.TransformerFactory<ts.SourceFile> = context => {
    const visit: ts.Visitor = node => {
        node = ts.visitEachChild(node, visit, context);
        if (ts.isClassDeclaration(node)) {
            console.log("class found and processing");
            return createReducerFunction(node);
        }
        if (ts.isImportDeclaration(node)) {
            return AstUtils.transformImportNodeToGeneratedFolderImportNodes(node)
        }
        return node;
    };

    return node => ts.visitNode(node, visit);
};



//constants

const createReducerFunction = (cd: ts.ClassDeclaration) => {
    setClassDeclaration(cd);
    const propDecls = getPropDeclsFromTypeMembers();
    const defaultState = getDefaultState(propDecls);
    const typeName = getTypeName();
    const actionTypes = getActionTypes()
    const caseClauses = getSwitchClauses(actionTypes);
    let [asyncActionType, asyncMeta] = getAsyncActionTypeAndMeta();
    let result = ts.createIdentifier("")
    if (caseClauses.length === 0 && asyncActionType === "") { // If no async properties and methods then return empty node
        result = ts.createIdentifier(EMPTY_REDUCER_TRANFORM_MESSAGE)
    } else {
        const f = buildFunction({ caseClauses: caseClauses, group: typeName });

        let actionType = actionTypes.map(at => {
            let result = ""
            if (at.payload) {
                result = `{name: "${at.name}" ,group :"${at.group}",payload:${at.payload}}`
            } else {
                result = `{name: "${at.name}" ,group :"${at.group}"}`
            }
            return result
        }).join(" | ")
        if (actionType === "") {
            actionType = "undefined"
        }
        if (asyncActionType === "") {
            asyncActionType = "undefined"
        }
        const meta = `{async:undefined,${asyncMeta}}`
        result = ts.createIdentifier(
            `
           export type ${typeName}State = ${getStateType()}
           
           export type ${typeName}Action = ${actionType}
  
           export type ${typeName}AsyncAction = ${asyncActionType}
  
           export const ${typeName}Group: ReducerGroup<${typeName}State,${typeName}Action,"${typeName}",${typeName}AsyncAction> = { r: ${f},g:"${typeName}",ds:${defaultState},m:${meta}}
  
          `
        );
    }

    cleanUpGloabals();
    return result;
};


type GeneralStatementResult = { kind: "GeneralStatement", statement: ts.Statement }

type MutationStatementResult = { kind: "MutationStatement", thisResult: ProcessThisResult, newValue: NewValue, newStatement: string }

type ForEachStatementResult = { kind: "ForEachStatement", statement: ts.ExpressionStatement, statementResults: StatementResult[] }

type IfStatementResult = { kind: "IfStatement", statement: ts.IfStatement, statementResults: StatementResult[] }

type IfElseStatementResult = { kind: "IfElseStatement", statement: ts.IfStatement, ifStatementResults: StatementResult[], elseStatementResults: StatementResult[] }

type TerinaryStatementResult = { kind: "TerinaryStatement", statement: ts.ExpressionStatement, trueExp: MutationStatementResult, falseExp: MutationStatementResult }

type StatementResult = GeneralStatementResult | MutationStatementResult
    | IfStatementResult | IfElseStatementResult | ForEachStatementResult | TerinaryStatementResult

type ParentGroupValue = { values: ProcessThisResult["values"], newValue: NewValue }

type ProcessStatementsOptions = { isReturnSupported?: boolean }
const getSwitchClauses = (actionTypes: ActionType[]) => {

    const methods = getMethodsFromTypeMembers();

    return methods
        .filter(m => m.body && m.body.statements.length > 0)
        .map(m => {
            const name = m.name.getText();
            const reservedStatements: string[] = [];
            const parentGroups: Map<
                string,
                Map<string, ParentGroupValue>
            > = new Map();
            const PREFIX = "_tr_";
            const propertyAssignments: string[] = [];
            let duplicateExists = false;
            const addOrUpdateParentGroup = (
                { group: g, value: v, values }: ProcessThisResult,
                newValue: NewValue
            ) => {
                const oldValue = parentGroups.get(g);
                if (!oldValue) {
                    const map = new Map();
                    parentGroups.set(g, map.set(v, { values, newValue }));
                } else {
                    if (oldValue.get(v)) {
                        duplicateExists = true;
                    }
                    parentGroups.set(g, oldValue.set(v, { values, newValue }));
                }
            };
            const paramsLenth = m.parameters.length;
            if (paramsLenth > 0) {
                const payloadType = actionTypes.find(at => at.name === name)!.payload
                let v = "";
                if (paramsLenth === 1) {
                    v = `const ${m.parameters[0].name.getText()} = (action as any).payload as (${payloadType})`;
                } else {
                    v = `const { ${m.parameters
                        .map(p => p.name.getText())
                        .join(",")} } = (action as any).payload as (${payloadType})`;
                }
                reservedStatements.push(v);
            }

            const statements = m.body!.statements;

            const replaceThisWithStateText = (input: string) => {
                let result = input
                for (const [key, value] of parentGroups) {
                    if (result.includes(`this.${key}`)) {
                        const r = new RegExp(`this\.${key}`, "g")
                        result = result.replace(r, `${PREFIX}${key}`)
                    }
                }
                result = result.replace(/this\./g, `${STATE_PARAM_NAME}.`)
                return result
            }
            // Todo cross check 
            const replaceThisWithState = (node: ts.Node) => {
                return replaceThisWithStateText(node.getText())
            }

            const isSupportedMutationExpression = (exp: ts.Expression) => {
                return ((ts.isPostfixUnaryExpression(exp)
                    || ts.isBinaryExpression(exp) ||
                    (ts.isCallExpression(exp) &&
                        ts.isPropertyAccessExpression(exp.expression) &&
                        isArrayMutatableAction(exp.expression.name))))

            }

            const isSupportedMutationStatement = (s: ts.Statement): s is ts.ExpressionStatement => {
                let result = false;
                const text = s.getText()
                if (ts.isExpressionStatement(s) && text.startsWith("this.")) {
                    result = isSupportedMutationExpression(s.expression)
                }
                return result;
            }

            const getOptionalGuardForOptionalPropAccess = (mvs: ProcessThisResult["values"]) => {
                let result = ""
                mvs.forEach(mv => {
                    if (mv.meta.isOptionalAccess) {
                        const p = `this.${mv.name}` // using this here instead of state , we will replace this with state in final step
                        if (result.length) {
                            result = `${result} && ${p}`
                        } else {
                            result = p
                        }
                    }
                })
                return result
            }

            const getModifiedField = (node: ts.Node): string => {
                if (ts.isNonNullExpression(node)) {
                    return getModifiedField(node.expression)
                }
                if (ts.isElementAccessExpression(node)) {
                    return `[${node.argumentExpression.getText()}]`
                } else if (ts.isPropertyAccessExpression(node)) {
                    return node.name.getText()
                } else { // TODO Implement other cases
                    throw new Error(`getModifiedField : have to implement this case: ${node.getText()} `)
                }
            }

            const processMutationStatement = (s: ts.ExpressionStatement): MutationStatementResult => {
                let mResult: MutationStatementResult = { kind: "MutationStatement" } as any
                if (ts.isPostfixUnaryExpression(s.expression)) {
                    let op = "";
                    const operand = s.expression.operand;
                    let isNullField = false
                    let processInput: ts.Node = (operand as any).expression
                    if (ts.isNonNullExpression(operand)) {
                        isNullField = true
                        processInput = (processInput as any).expression
                    }
                    const thisResult = processThisStatement2(processInput);
                    const exprLeft = operand.getText();
                    const exprRight = "1";
                    let modifiedField = getModifiedField(operand)
                    console.log("modified Field", modifiedField);
                    let newValue = { name: modifiedField, op: "=", value: "" };
                    let x = exprLeft.replace("this.", `${STATE_PARAM_NAME}.`)
                    if (isNullField) {
                        x = x.slice(0, -1);
                    }
                    if (s.expression.operator === ts.SyntaxKind.PlusPlusToken) {
                        op = "+=";
                        newValue.value = isNullField ? `${x} ? ${x} : ${x} + 1 ` : `${x} + 1`;
                    } else {
                        op = "-=";
                        newValue.value = isNullField ? `${x} ? ${x} : ${x} - 1 ` : `${x} - 1`;
                    }
                    mResult.thisResult = thisResult
                    mResult.newValue = newValue

                    let newStatement = s.getText().replace("this.", PREFIX)
                    if (isNullField) {
                        newStatement = `if(${operand.getText().slice(0, -1)}) {
                            ${newStatement}
                        }`
                    }
                    if (thisResult.values.filter(v => v.meta.isOptionalAccess).length > 0) { // optional access
                        newStatement = `if(${getOptionalGuardForOptionalPropAccess(thisResult.values)}) {
                          ${newStatement}
                      }`
                    }
                    mResult.newStatement = newStatement


                } else if (ts.isBinaryExpression(s.expression)) {
                    const left = s.expression.left;
                    const thisResult = processThisStatement2((left as ts.PropertyAccessExpression).expression as any);
                    const exprLeft = left.getText();
                    let exprRight = replaceThisWithState(s.expression.right);
                    const op = s.expression.operatorToken.getText();
                    let modifiedField = getModifiedField(left)
                    let newValue = { name: modifiedField, op: op, value: exprRight };

                    if (s.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                        newValue.value = exprRight;
                    } else {
                        newValue.value = `${exprLeft.replace(
                            "this.",
                            ""
                        )} ${op} ${exprRight}`;
                    }
                    // addOrUpdateParentGroup(result, newValue);
                    mResult.thisResult = thisResult
                    mResult.newValue = newValue
                    let newStatement = `${exprLeft.replace("this.", PREFIX)} ${op} ${exprRight}`
                    if (thisResult.values.filter(v => v.meta.isOptionalAccess).length > 0) { // optional access
                        newStatement = `if(${getOptionalGuardForOptionalPropAccess(thisResult.values)}) {
                          ${newStatement}
                      }`
                    }
                    mResult.newStatement = newStatement

                } else if (
                    ts.isCallExpression(s.expression) &&
                    ts.isPropertyAccessExpression(s.expression.expression) &&
                    isArrayMutatableAction(s.expression.expression.name)
                ) {
                    const exp = s.expression.expression;
                    const thisResult = processThisStatement2(exp.expression as any);
                    let args = s.expression.arguments.map(a => a.getText()).join(",");
                    let modifiedField = getModifiedField(exp.expression)
                    let newValue = {
                        name: modifiedField,
                        op: s.expression.expression.name.getText(),
                        value: ""
                    };
                    newValue.value = args;
                    // addOrUpdateParentGroup(result, newValue);
                    let newStatement = s.getText().replace("this.", PREFIX)
                    if (thisResult.values.filter(v => v.meta.isOptionalAccess).length > 0) { // optional access
                        newStatement = `if(${getOptionalGuardForOptionalPropAccess(thisResult.values)}) {
                          ${newStatement}
                      }`
                    }
                    mResult.thisResult = thisResult
                    mResult.newValue = newValue
                    mResult.newStatement = newStatement
                } else {
                    throw new Error(`Hmm, this type of mutation not supported yet, please file an issue with sample code.`)
                }

                return mResult;

            }

            const isBlockContainsMutationStatements = (b: ts.Block): boolean => {
                return Boolean(b.statements.find(s => isSupportedMutationStatement(s)))
            }

            const isForEachStatementContainsMutationStatements = (input: ts.CallExpression): boolean => {
                let result = false
                const argument = input.arguments[0]
                if (ts.isFunctionExpression(argument)) {
                    result = Boolean(argument.body.statements.find(s => isSupportedMutationStatement(s)))
                } else if (ts.isArrowFunction(argument)) {
                    const body = argument.body
                    if (ts.isBlock(body)) {
                        result = isBlockContainsMutationStatements(body)
                    } else {
                        result = body.getText().startsWith("this.") && isSupportedMutationExpression(body)
                    }
                }
                return result
            }

            const getForEachStatements = (input: ts.CallExpression): ts.NodeArray<ts.Statement> | ts.Expression => {
                const argument = input.arguments[0]
                if (ts.isFunctionExpression(argument)) {
                    return argument.body.statements
                } else {
                    const af = argument as ts.ArrowFunction
                    const body = af.body
                    if (ts.isBlock(body)) {
                        return body.statements
                    } else {
                        return body;
                    }
                }
            }

            const processForEachStatement = (s: ts.ExpressionStatement): ForEachStatementResult => {
                let result: ForEachStatementResult = { kind: "ForEachStatement" } as any
                result.statement = s
                const forachStatement = getForEachStatements(s.expression as any)
                if (Array.isArray(forachStatement)) {
                    result.statementResults = processStatements(forachStatement, { isReturnSupported: true })
                } else {
                    result.statementResults = processStatements([statements] as any, { isReturnSupported: true })
                }
                return result
            }

            const isTerinaryStatementContainsMutationExpression = (s: ts.ExpressionStatement): boolean => {
                let result = false
                if (ts.isConditionalExpression(s.expression)) {
                    result = isSupportedMutationExpression(s.expression.whenTrue) && isSupportedMutationExpression(s.expression.whenFalse)
                }
                return result;
            }

            const processTerinaryStatement = (s: ts.ExpressionStatement): TerinaryStatementResult => {
                let result: TerinaryStatementResult = { kind: "TerinaryStatement" } as any
                const cond = s.expression as ts.ConditionalExpression
                result.statement = s
                result.trueExp = processMutationStatement(ts.createExpressionStatement(cond.whenTrue))
                result.falseExp = processMutationStatement(ts.createExpressionStatement(cond.whenFalse))
                return result
            }

            const isIfStatementOnly = (s: ts.Statement): s is ts.IfStatement => {
                return ts.isIfStatement(s) && !s.elseStatement
            }

            const isIfElseStatement = (s: ts.Statement) => {
                return ts.isIfStatement(s) && s.elseStatement
            }

            const isIfStatementContainsMutationExpression = (s: ts.IfStatement) => {
                let result = false
                if (ts.isBlock(s.thenStatement)) {
                    result = isBlockContainsMutationStatements(s.thenStatement)
                } else {
                    result = isSupportedMutationStatement(s.thenStatement)
                }
                return result
            }

            const isForEachNode = (node: ts.Node) => {
                return ts.isExpressionStatement(node) &&
                    ts.isCallExpression(node.expression) &&
                    ts.isPropertyAccessExpression(node.expression.expression) &&
                    node.expression.expression.name.getText() === "forEach"
            }

            const processIfonlyStatement = (s: ts.IfStatement, options: ProcessStatementsOptions): IfStatementResult => {
                let result: IfStatementResult = { kind: "IfStatement" } as any
                result.statement = s

                if (ts.isBlock(s.thenStatement)) {
                    result.statementResults = processStatements(s.thenStatement.statements, options)
                } else { // single if statement (if return , if x= 7)
                    s.parent
                    result.statementResults = processStatements([s.thenStatement] as any, options)
                }
                return result
            }

            const processIfElseStatement = (s: ts.IfStatement, options: ProcessStatementsOptions): IfElseStatementResult => {
                let result: IfElseStatementResult = { kind: "IfElseStatement" } as any
                result.statement = s;
                const thenStatement = s.thenStatement
                if (ts.isBlock(thenStatement)) {
                    result.ifStatementResults = processStatements(thenStatement.statements, options)
                } else { // single if statement (if return , if x= 7)
                    result.ifStatementResults = processStatements([thenStatement] as any, options)
                }
                const elseStatement = s.elseStatement!;
                if (ts.isBlock(elseStatement)) {
                    result.elseStatementResults = processStatements(elseStatement.statements, options)
                } else if (isIfStatementOnly(elseStatement)) {
                    result.elseStatementResults = [processIfonlyStatement(elseStatement, options)]
                } else if (isIfElseStatement(elseStatement)) {
                    result.elseStatementResults = [processIfElseStatement(elseStatement as any, options)]
                } else {
                    result.elseStatementResults = processStatements([elseStatement] as any, { isReturnSupported: true })
                }

                return result;
            }

            const processStatements = (statements: ts.NodeArray<ts.Statement>, options: ProcessStatementsOptions = {}): StatementResult[] => {
                let results: StatementResult[] = []
                statements.forEach(s => {
                    console.log("Processing statement : ", s.getText())
                    if (isSupportedMutationStatement(s)) {
                        results.push(processMutationStatement(s))
                    } else if (ts.isExpressionStatement(s) &&
                        ts.isCallExpression(s.expression) &&
                        ts.isPropertyAccessExpression(s.expression.expression) &&
                        s.expression.expression.name.getText() === "forEach") {
                        results.push(processForEachStatement(s))
                    } else if (ts.isExpressionStatement(s) && isTerinaryStatementContainsMutationExpression(s)) {
                        results.push(processTerinaryStatement(s))
                    } else if (ts.isIfStatement(s) && !s.elseStatement) {
                        results.push(processIfonlyStatement(s, options))
                    } else if (ts.isIfStatement(s) && s.elseStatement) {
                        results.push(processIfElseStatement(s, options))
                    }
                    else if (ts.isExpressionStatement(s) && ts.isDeleteExpression(s.expression)) {
                        throw new Error("delete expression not supported,  instead assign value to property")
                    } else if (ts.isReturnStatement(s) && !options.isReturnSupported) {
                        throw new Error(`Return statement is not supported use if else `)
                    }
                    else {
                        const result: GeneralStatementResult = { kind: "GeneralStatement", statement: s }
                        results.push(result)
                    }
                });
                return results
            }


            const statementsResults = processStatements(statements)
            let otherThanStraightOnlyMutationExist = false
            const mutationOnlyStatementResults = (input: StatementResult[]): MutationStatementResult[] => {
                let results: MutationStatementResult[] = []
                input.forEach(sr => {
                    if (sr.kind === "MutationStatement") {
                        results.push(sr)
                    } else if (sr.kind === "ForEachStatement") {
                        otherThanStraightOnlyMutationExist = true
                        const fr = mutationOnlyStatementResults(sr.statementResults)
                        results.push(...fr)
                    } else if (sr.kind === "IfStatement") {
                        otherThanStraightOnlyMutationExist = true
                        const ifr = mutationOnlyStatementResults(sr.statementResults)
                        results.push(...ifr)
                    } else if (sr.kind === "IfElseStatement") {
                        otherThanStraightOnlyMutationExist = true
                        const ifr = mutationOnlyStatementResults(sr.ifStatementResults)
                        const er = mutationOnlyStatementResults(sr.elseStatementResults)
                        results.push(...ifr)
                        results.push(...er)
                    } else if (sr.kind === "TerinaryStatement") {
                        otherThanStraightOnlyMutationExist = true
                        if (sr.trueExp.kind === "MutationStatement") {
                            results.push(sr.trueExp)
                        }
                        if (sr.falseExp.kind === "MutationStatement") {
                            results.push(sr.falseExp)
                        }
                    } else {
                        otherThanStraightOnlyMutationExist = true
                    }
                })

                return results
            }

            const straightMutationStatementResults = mutationOnlyStatementResults(statementsResults)

            if (straightMutationStatementResults.length === 0) {
                throw new Error(`Every method of class must contain atleaset one mutation statement`)
            }

            straightMutationStatementResults.forEach(msr => {
                addOrUpdateParentGroup(msr.thisResult, msr.newValue)
            })



            if (!duplicateExists && !otherThanStraightOnlyMutationExist) {
                parentGroups.forEach((map, group) => {
                    const key = Array.from(map.keys())[0];
                    const v = map.get(key)
                    if (v && v.values.length === 1 && v.values[0].meta.type === MetaType.UNKNOWN) {
                        propertyAssignments.push(
                            `${group}:${v.newValue.value}`
                        );
                    } else {
                        propertyAssignments.push(
                            `${group}:${invalidateObjectWithList({ input: map })}`
                        );
                    }

                });
                return `case "${name}" : {
                    ${reservedStatements.join("\n")}
                    return { ...${STATE_PARAM_NAME}, ${propertyAssignments.join(",")} }
                }`;
            }


            parentGroups.forEach((map, group) => {
                console.log("parent Group Entries: ", group, "Values : ", map);
                const key = Array.from(map.keys())[0];
                const mv = map.get(key)
                if (map.size === 1 && mv && mv.values.length === 1 && !key.includes(".")) {
                    // const a1 = map.get(key)![0][0];
                    // console.log("Single param : ", a1.meta);
                    const a1 = mv.values[0]
                    let s = "";
                    const sk = `${PREFIX}${group}`;
                    const pAccess = `${STATE_PARAM_NAME}.${group}`
                    if (a1.meta.type === MetaType.ARRAY) {
                        let av = `[...${pAccess}]`
                        if (a1.meta.isOptionalAccess || a1.meta.isTypeOptional) {
                            av = `${pAccess} ? ${av} : ${pAccess}`
                        }
                        s = `let ${sk} = ${av}`;
                    } else if (a1.meta.type === MetaType.OBJECT) {
                        let ov = `{...${pAccess}}`
                        if (a1.meta.isOptionalAccess || a1.meta.isTypeOptional) {
                            ov = `${pAccess} ? ${ov} : ${pAccess}`
                        }
                        s = `let ${sk} = ${ov}`;
                    } else {
                        s = `let ${sk} = ${pAccess}`;
                    }
                    reservedStatements.push(s);
                } else {
                    reservedStatements.push(
                        `let ${PREFIX}${group} = ${invalidateObjectWithList({
                            input: map
                        })}`
                    );
                }
                propertyAssignments.push(`${group}:${PREFIX}${group}`);
            });



            const getStringVersionOfForEachStatementResult = (fsr: ForEachStatementResult): string => {

                const ce = fsr.statement.expression as ts.CallExpression
                const v = replaceThisWithState(ce.expression)
                let functionBody = ""
                const arg = ce.arguments[0]
                if (ts.isArrowFunction(arg)) {
                    const af = arg
                    const params = af.parameters.map(p => p.getText()).join(" ,")
                    functionBody = `(${params}) => {
                       ${getOutputStatements(fsr.statementResults).join("\n")}
                    }`
                } else if (ts.isFunctionExpression(arg)) {
                    const fe = arg
                    const params = fe.parameters.map(p => p.getText()).join(" ,")
                    functionBody = `
                      function (${params}) {
                        ${getOutputStatements(fsr.statementResults).join("\n")}
                      }
                    `
                }
                const result = `
                   ${v}(${functionBody})
                `
                return result;
            }

            const getStringVersionOfIfStatementResult = (isr: IfStatementResult) => {
                const is = isr.statement
                let body = ""
                if (ts.isBlock(is.thenStatement)) {
                    body = `{  
                        ${getOutputStatements(isr.statementResults).join("\n")}
                    }`
                } else {
                    body = `${getOutputStatements(isr.statementResults).join("\n")}`
                }
                const result = `
                  if(${replaceThisWithState(is.expression)}) ${body}
                `
                return result;
            }

            const getStringVersionOfIfElseStatementResult = (iesr: IfElseStatementResult): string => {
                const ies = iesr.statement

                const ifCond = replaceThisWithState(ies.expression)
                let ifBody = ""
                if (ts.isBlock(ies.thenStatement)) {
                    ifBody = `{  
                        ${getOutputStatements(iesr.ifStatementResults).join("\n")}
                    }`
                } else {
                    ifBody = `${getOutputStatements(iesr.ifStatementResults).join("\n")}`
                }
                const elseS = ies.elseStatement!
                let else_str = ""
                if (ts.isBlock(elseS) || isSupportedMutationStatement(elseS)) {
                    else_str = `else {
                         ${getOutputStatements(iesr.elseStatementResults).join("\n")}
                     }`
                } else if (isIfStatementOnly(elseS)) {
                    else_str = `else ${getStringVersionOfIfStatementResult(iesr.elseStatementResults[0] as any)}`
                } else if (isIfElseStatement(elseS)) {
                    else_str = `else ${getStringVersionOfIfElseStatementResult(iesr.elseStatementResults[0] as any)}`
                }
                const result = `
                  if(${ifCond}) ${ifBody}
                  ${else_str}
                `
                return result
            }

            const getOutputStatements = (input: StatementResult[]): string[] => {
                const results: string[] = []
                input.forEach(sr => {
                    if (sr.kind === "MutationStatement") {
                        results.push(replaceThisWithStateText(sr.newStatement))
                    } else if (sr.kind === "GeneralStatement") {
                        results.push(replaceThisWithState(sr.statement))
                    } else if (sr.kind === "TerinaryStatement") {
                        const ts = sr.statement
                        const ce = ts.expression as ts.ConditionalExpression
                        const ts_string = `${replaceThisWithState(ce.condition)} ? ${sr.trueExp.newStatement} : ${sr.falseExp.newStatement}`
                        results.push(ts_string)
                    } else if (sr.kind === "ForEachStatement") {
                        const fs_string = getStringVersionOfForEachStatementResult(sr)
                        results.push(fs_string)
                    } else if (sr.kind === "IfStatement") {
                        const is_string = getStringVersionOfIfStatementResult(sr)
                        results.push(is_string)
                    } else if (sr.kind === "IfElseStatement") {
                        const ies_string = getStringVersionOfIfElseStatementResult(sr)
                        results.push(ies_string)
                    }
                })
                return results
            }

            const outputStatements = getOutputStatements(statementsResults)

            return `case "${name}" : {
                ${reservedStatements.join("\n")}
                ${outputStatements.join("\n")}
                return { ...${STATE_PARAM_NAME}, ${propertyAssignments.join(",")} }
            }`;
        });
};

const invalidateObjectWithList = ({
    input,
    traversed = [],
    parent = STATE_PARAM_NAME
}: {
    input: Map<string, ParentGroupValue>;
    traversed?: string[];
    parent?: string;
}): string => {
    const entries = Array.from(input.entries());
    if (input.size === 1) {
        const [key, value] = entries[0];
        const v =
            traversed.length > 0 ? `${parent}.${traversed.join(".")}` : `${parent}`;
        return invalidateObject({
            map: { input: key.split("."), values: value.values, newValue: value.newValue },
            parent: v
        });
    } else {
        //TODO multiple
        return "TODO multiple entires of same object";
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
};

const invalidateObject = ({
    map: { input, values, newValue },
    traversed = [],
    parent = STATE_PARAM_NAME
}: {
    map: {
        input: string[];
        values: ProcessThisResult["values"];
        newValue: NewValue;
    };
    traversed?: { name: string; access?: string }[];
    parent?: string;
}): string => {
    console.log(
        "Invalidatin object : input:  ",
        input,
        "traversed : ",
        traversed,
        "values: ",
        values,
        "aprent : ",
        parent
    );
    const v1 = input[0];
    const vv1 =
        traversed.length > 0
            ? `${traversed.map(t => t.name).join(".")}.${v1}`
            : `${v1}`;
    const v =
        traversed.length > 0
            ? `${parent}.${traversed
                .map(t => (t.access ? `${t.name}${t.access}` : t.name))
                .join(".")}.${v1}`
            : `${parent}.${v1}`;
    const v1t = values.find(v => v.name === vv1)!;
    console.log("v:", v, "v1t:", v1t);
    if (input.length === 1) {
        if (v1t.meta.type === MetaType.UNKNOWN) {
            throw new Error(`can not invalidate unknown type`)
        }
        if (v1t.meta.type === MetaType.ARRAY) {
            let result = "";
            if (v1t.meta.access && v1t.meta.access.length > 1) {
                // TODO multiple argument access
                console.log("****** numberAcess found1 ", v1t.meta.isOptionalAccess);
                const a = v1t.meta.access[0].name;
                let obs = `{...${TSTORE_TEMP_V},${newValue.name}:${newValue.value}}`;
                if (v1t.meta.isOptionalAccess || v1t.meta.isTypeOptional) {
                    obs = `${TSTORE_TEMP_V} ? ${obs} : ${TSTORE_TEMP_V}`;
                }
                const result = `[...${v}.map((${TSTORE_TEMP_V},_i) => _i === ${a} ? ${obs} : ${TSTORE_TEMP_V})]`;
                console.log("result : ", result);
                return result;
            } else if (v1t.meta.access) {
                // single argument access
                const a = v1t.meta.access[0].name;
                console.log(
                    "********** Argument Access found",
                    "newValue : ",
                    newValue,
                    "v1t: ",
                    v1t
                );
                let obs = `{...${TSTORE_TEMP_V},${newValue.name}:${newValue.value}}`;
                if (v1t.meta.isOptionalAccess || v1t.meta.isTypeOptional) {
                    obs = `${TSTORE_TEMP_V} ? ${obs} : ${TSTORE_TEMP_V}`;
                }
                const result = `[...${v}.map((${TSTORE_TEMP_V},_i) => _i === ${a} ? ${obs} : ${TSTORE_TEMP_V})]`;
                console.log("result : ", result);
                return result;
            } else {
                const op = newValue.op;
                const args = newValue.value;
                switch (op) {
                    case "push": {
                        result = `${v}.concat(${args})`;
                        break;
                    }
                    case "pop": {
                        result = `${v}.slice(0,-1)`;
                        break;
                    }
                    case "splice": {
                        const a = args.split(",").map(a => a.trim());
                        const startParsed = parseInt(a[0], 10)
                        const start = isNaN(startParsed) ? a[0] : startParsed
                        const deleteCountParsed = parseInt(a[1], 10)
                        const deleteCount = isNaN(deleteCountParsed) ? a[1] : deleteCountParsed
                        if (a.length === 1) {
                            result = `[...${v}.slice(0,${start})]`;
                        } else if (a.length == 2) {
                            result = `[...${v}.slice(0,${start}),...${v}.slice(${start} + ${deleteCount})]`;
                        } else {
                            result = `[...${v}.slice(0,${a[0]}),...[${a.slice(2)}],...${v}.slice(${start} + ${deleteCount})]`;
                        }
                        break;
                    }
                    default:
                        result = `[...${v}].${op}(${args})`;
                }
                if (v1t.meta.isOptionalAccess || v1t.meta.isTypeOptional) {
                    return `${v} ? ${result} : ${v}`;
                }
                return result;
            }
        } else {
            const r = `{...${v},${newValue.name}:${newValue.value}}`;
            if (v1t.meta.isOptionalAccess || v1t.meta.isTypeOptional) {
                console.log(`Optional found1 : ,v1 = ${v1}, v = ${v}`);
                return `${v} ? ${r} : ${v}`;
            }
            return r;
        }
    } else {
        const v2 = input[1];
        const v2t = values.find(v => v.name === vv1)!;
        let access = v1t.meta.access?.[0].name || undefined;
        if (v1t.meta.isOptionalAccess) {
            access = access ? `![${access}]` : "!";
        }
        const v2exapnd = invalidateObject({
            map: { input: input.slice(1), values, newValue },
            traversed: traversed.concat([{ name: v1, access }])
        });
        console.log(`v2 expand : `, v2exapnd);
        let expand = "";
        if (v1t.meta.type === MetaType.ARRAY) {
            let obs = `{...${TSTORE_TEMP_V},${v2}:${v2exapnd}}`;
            if (v1t.meta.isOptionalAccess || v1t.meta.isTypeOptional) {
                obs = `${TSTORE_TEMP_V} ? ${obs} : ${TSTORE_TEMP_V}`;
            }
            expand = `[...${v}.map((${TSTORE_TEMP_V},_i) => _i === ${v1t.meta.access?.[0].name} ? ${obs} : ${TSTORE_TEMP_V})]`;
        } else {
            expand = `{ ...${v},${v2}:${v2exapnd} }`;
            if (v1t.meta.isOptionalAccess || v1t.meta.isTypeOptional) {
                expand = `${v} ? ${expand} : ${v}`;
            }
        }
        if (v2t.meta.isOptionalAccess || v2t.meta.isTypeOptional) {
            console.log(`Optional found2 : ,v2 = ${v2}, v = ${v}`);
            return `${v} ? ${expand} : ${v}`;
        }
        return expand;
    }
};

const getDefaultState = (props: LocalPropertyDecls[]) => {
    return `{${props
        .filter(p => p.pd.initializer)
        .map(p => `${p.pd.name.getText()}:${p.pd.initializer!.getText()}`)}}`;
};

function buildFunction({
    caseClauses,
    group
}: {
    caseClauses: string[];
    group: string;
}) {
    if (caseClauses.length > 0) {
        return `
    (${STATE_PARAM_NAME}:${group}State,action:${group}Action) => {
       const t = action.name
       switch(t) {
         ${caseClauses.join("\n")}
       }
    }
  `;
    } else {
        return `
     (${STATE_PARAM_NAME}:${group}State,action:${group}Action) => {
       return ${STATE_PARAM_NAME};
      }
     `
    }

}


let storePath: string = null as any

// let config: TypeSafeStoreConfigExtra = null as any


export function setCurrentProcessingReducerFile(file: string) {
    currentProcessingReducerFile = file
    if (!globalMeta.get(file)) {
        // const baseReducersPath = getBaseReducersPath()


        // globalMeta.set(file, {fullPath:file,path:})
    }
}

export function getCurrentProcessingReducerFile() {
    return currentProcessingReducerFile;
}



export function setClassDeclaration(cd: ts.ClassDeclaration) {
    // console.log("setting class declaration : ", cd.members);
    classDecl = cd;
    const typeChecker = AstUtils.getTypeChecker();
    const type = typeChecker.getTypeAtLocation(cd);
    members = cd.members;
    memberTypes = AstUtils.getMembersOfType(type, classDecl);
    propDecls = getPropDeclsFromTypeMembers();
}

export function cleanUpGloabals() {
    // typeChecker = null as any
    classDecl = null as any;
    members = null as any;
    memberTypes = null as any;
    propDecls = null as any;
    currentProcessingReducerFile = ""
}



const geenratePromiseDataType = (lpd: LocalPropertyDecls) => {
    const tpe = lpd.typeStr
    const i = tpe.indexOf("<")
    const j = tpe.indexOf(">")
    return `PromiseData<${tpe.substr(i + 1, j)}>`
}

const getStateType = () => {
    return `{${propDecls
        .map(p => {
            const n = p.pd.name.getText();
            const tpe = p.typeStr
            if (tpe.startsWith("Promise<")) {
                return `${n}${p.pd.questionToken ? "?" : ""}:${geenratePromiseDataType(p)}`
            }
            let t = p.typeStr
            if (p.pd.type) { // Dont use tostring value as it fetches all values of types and we cant add individual imports  
                t = p.pd.type.getText()
            }
            return `${n}${p.pd.questionToken ? "?" : ""}:${t}`;
        })
        .join(",")}}`;
};

export const lastElementOfArray = <T>(a: T[]) => {
    return a[a.length - 1];
};



/**
 * 
 * @param lpd async(Fetch) property declaration
 */
export function generateFetchActionType(lpd: LocalPropertyDecls): string {
    console.log("generateFetchActionType Input: ", lpd.typeStr);
    const tpe = lpd.typeStr;
    const metaIndex = lpd.typeStr.indexOf("_fmeta")
    const metaTypeRaw = tpe.substring(metaIndex).replace("_fmeta?:", "");
    const lastOrIndex = metaTypeRaw.lastIndexOf("|");
    const result = metaTypeRaw.substr(0, lastOrIndex);
    console.log("generateFetchActionType Output: ", result);
    return result;
}

/**
 *  All async actions of a class
 */
export const getAsyncActionTypeAndMeta = (): [string, string] => {
    const group = `${ConfigUtils.getPrefixPathForReducerGroup(currentProcessingReducerFile)}${getTypeName()}`;
    const fetchProps: string[] = []
    const promiseProps: string[] = []
    const asyncType = propDecls
        .filter(isAsyncPropDeclaration)
        .map(p => {
            let result = "undefined";
            console.log(
                "Async TypeStr : ", p.typeStr,
            );
            const tpe = p.typeStr
            const name = p.pd.name.getText()
            if (tpe.startsWith("Promise<")) {
                promiseProps.push(name)
                result = `{name:"${name}",group:"${group}", promise: () => ${p.typeStr} }`;
            } else if (tpe.includes("_fmeta")) {
                fetchProps.push(name)
                result = `{name:"${
                    name
                    }",group:"${group}", fetch: ${generateFetchActionType(p)}  }`;
            }
            return result;
        })
        .join(" | ");
    const meta = `
    f:${fetchProps.length > 0 ? `{${fetchProps.map(p => `${p}:{}`).join(",")}}` : "undefined"},
    p:${promiseProps.length > 0 ? `{${promiseProps.map(p => `${p}:{}`).join(",")}}` : "undefined"}
  `
    return [asyncType, meta]
};

type ActionType = { name: string, group: string, payload?: string }

// const replaceTypeParamaneter = (tn:ts.TypeNode,tp:ts.TypeParameter) => {
//     ts.getMutableClone
//     const result: ts.Node[] = [];
//     function find(node: ts.Node) {
//         if (cond(node)) {
//             result.push(node);
//             return;
//         } else {
//             ts.forEachChild(node, find);
//         }
//     }
//     find(node);
//     return result;
// }


export const getActionTypes = (): ActionType[] => {
    const methods = getMethodsFromTypeMembers();
    const group = `${ConfigUtils.getPrefixPathForReducerGroup(currentProcessingReducerFile)}${getTypeName()}`;
    return methods.map(m => {
        const n = m.name.getText();
        const params = m.parameters
        const pl = params.length;
        if (pl === 0) {
            return { name: n, group }
        }
        let t = AstUtils.typeToString(
            memberTypes.find(mt => mt.name === n)!.type
        );
        let payload = ""
        if (pl === 1) {
            payload = params[0].type!.getText() // dont uses toString value as it replaces all references to its values and we cant import all individual types
            if (m.typeParameters) {
                const tp = m.typeParameters[0]
                const name = tp.name.getText()
                const r = new RegExp(name, "g") //TODO dont replace blidnly we have to iterate over type or just dont support type contraints https://stackoverflow.com/questions/61110391/how-to-replace-typeparaameter-from-typenode-using-typescript-compiler
                payload = payload.replace(r, tp.constraint!.getText())
            }
        } else {
            const typeParams = m.typeParameters ?
                m.typeParameters.map(tp => ({ name: tp.name.getText(), constraint: tp.constraint!, })) : []//Note: User should provide contrain based typeparams
            const paramsProcessed = params.map(p => {
                const name = p.name.getText()
                const isOptional = !!p.questionToken
                let t = p.type!.getText() // dont uses toString value as it replaces all references to its values and we cant import all individual types
                if (typeParams.length > 0) {
                    typeParams.forEach(tp => {
                        if (tp.name === t) {
                            t = tp.constraint.getText()
                        }
                    })
                }
                return `${name}${isOptional ? "?" : ""}: ${t}`
            })
            payload = `{${paramsProcessed.join(", ")}}`
        }
        return { name: n, group, payload };
    })


};





//   function isArrayType(type: ts.Type): boolean {
//     return isTypeReference(type) && (
//       type.target.symbol.name === "Array" ||
//       type.target.symbol.name === "ReadonlyArray"
//     );
//   }

export function getTypeForPropertyAccess(
    input: string[],
    mTypes: { name: string; type: ts.Type }[] = memberTypes
): ts.Type {
    // console.log("**getTypeForPropertyAccess : ", "input: ", input, mTypes.length);
    let t = mTypes.find(mt => mt.name === input[0])!.type;
    // console.log("Type : ", AstUtils.typeToString(t));
    if (input.length === 1) {
        return t;
    } else {
        const nt = AstUtils.getNonNullableType(t)
        if (AstUtils.isArrayType(nt)) {
            // console.log("**** ok its array type : ", input[0]);
            if (AstUtils.isTypeReference(nt)) {
                // console.log("its reference type");
                t = nt.typeArguments![0];
            } else {
                t = (nt as any).elementType;
                // console.log("its regular array type :", t);
            }
        }
        return getTypeForPropertyAccess(input.slice(1), AstUtils.getMembersOfType(t, classDecl));
    }
}



export function isArrayPropAccess(input: string) {
    // console.log("**** isArrayPropAccess", input);
    const result = AstUtils.isArrayType(getTypeForPropertyAccess(input.split(".")));
    // console.log("**** isArrayPropAccess result : ", result);
    return result;
}

function getTypeFromPropAccess(input: string): MetaType {
    const t = getTypeForPropertyAccess(input.split("."));
    const ts1 = AstUtils.typeToString(t);
    let result = MetaType.OBJECT;
    if (ts1.endsWith("[]")) {
        result = MetaType.ARRAY;
    }
    return result;
}

function getTypeFromPropAccessAndElementAccess(
    input: string,
    accees: EAccess[]
): [MetaType, EAccess[]] | undefined {
    const t = getTypeForPropertyAccess(input.split("."));
    const ts1 = AstUtils.typeToString(t);
    let result: [MetaType, EAccess[]] | undefined = undefined;
    return result;
}

export function getTypeName() {
    return classDecl.name!.getText();
}

export const isPropertyDecl = (input: ts.ClassElement) => {
    return ts.isPropertyDeclaration(input);
};


export const getPropDeclsFromTypeMembers = (): LocalPropertyDecls[] => {
    return members.filter(ts.isPropertyDeclaration).map(m => {
        const pd = m as ts.PropertyDeclaration;
        const type = memberTypes.find(mt => mt.name === pd.name.getText())!.type;
        const typeStr = AstUtils.typeToString(type)
        return { pd, type, typeStr };
    });
};

export function isAsyncPropDeclaration(input: LocalPropertyDecls) {
    return input.typeStr.startsWith(T_STORE_ASYNC_TYPE) || input.typeStr.startsWith("Promise<");
}

export const getMethodsFromTypeMembers = () => {
    return members
        .filter(ts.isMethodDeclaration)
        .map(p => p as ts.MethodDeclaration);
};

export const getTypeOfPropertyDecl = (
    input: ts.PropertyDeclaration,
    checker: ts.TypeChecker
) => {
    checker.getTypeAtLocation(input);
};

export function isArrayMutatableAction(s: ts.Identifier) {
    const name = s.getText();
    return arrayMutableMethods.includes(name);
}

//TODO unfinshed
export const getNameofPropertyName = (p: ts.PropertyName) => {
    if (ts.isIdentifier(p)) {
        return p.escapedText.toString();
    }
    return p.toString();
};

export const createPropertyAccessForString = (
    input: string[]
): ts.PropertyAccessExpression => {
    if (input.length == 2) {
        const f = input[0];
        const n = f === "this" ? ts.createThis() : ts.createIdentifier(f);
        return ts.createPropertyAccess(n, ts.createIdentifier(input[1]));
    }
    const l = input[input.length - 1];
    input.pop();
    return ts.createPropertyAccess(
        createPropertyAccessForString(input),
        ts.createIdentifier(l)
    );
};



function typeOfMultipleArray(input: EAccess[], name: string): EAccess[] {
    const t = getTypeForPropertyAccess(name.split("."));
    let result: MetaType[] = [];
    if (AstUtils.isTypeReference(t)) {
    } else {
        const s = AstUtils.typeToString(t);
        if (s.endsWith("[]") || s.startsWith("Array")) {
            result.push(MetaType.ARRAY);
        } else if (s.startsWith("Map")) {
            result.push(MetaType.MAP);
        } else if (s.startsWith("Set")) {
            result.push(MetaType.SET);
        } else {
            result.push(MetaType.OBJECT);
        }
    }
    // console.log("********** typeOfMultipleArray ***********", input[0].exp);
    return input.map((a, index) => ({ ...a, type: result[index] }));
}


type ProcessThisStatementOptions = { arrayMut?: boolean }

function processThisStatement2(exp: ts.Node, options: ProcessStatementsOptions = {}): ProcessThisResult {
    console.log("process thisResult input: ", exp.getText())
    const values: MetaValue[] = [];
    let propIdentifier: Meta = { type: MetaType.UNKNOWN };
    let argumentAccessOptional = false;
    let group = ""
    let onlyThisInput = false

    function emptyPropidentifier() {
        return { type: MetaType.UNKNOWN };
    }
    function updateValues(parent: string) {
        values.forEach(v => {
            v.name = `${parent}.${v.name}`
        })
    }

    function processInner(input: ts.Node): any {

        if (ts.isTypeNode(input)) {
            const parent = input.parent as ts.PropertyAccessExpression
            const name = parent.name.getText()
            group = name
            if (values.length === 0) {
                onlyThisInput = true
                values.push({ name, meta: { type: MetaType.UNKNOWN } }) // this.prop = value , no need to invalidate anything as parent is this ,so type is UNKOWN which we will check in invalidateObject method
            }
            return
        } else if (ts.isPropertyAccessExpression(input) && input.expression.kind === ts.SyntaxKind.ThisKeyword) {
            const name = input.name.getText()
            updateValues(name)
            group = name
            values.push({ name, meta: { ...propIdentifier } })
            propIdentifier = emptyPropidentifier()
            return
        } else if (ts.isPropertyAccessExpression(input)) {
            const name = input.name.getText()
            updateValues(name)
            values.push({ name, meta: { ...propIdentifier, } })
            propIdentifier = emptyPropidentifier()
            return processInner(input.expression)
        } else if (
            ts.isNonNullExpression(input) &&
            ts.isPropertyAccessExpression(input.expression)
        ) {
            const name = input.expression.name.getText()
            updateValues(name)
            values.push({ name, meta: { ...propIdentifier, isOptionalAccess: true, } })
            propIdentifier = emptyPropidentifier()
            return processInner(input.expression.expression)
        } else if (
            ts.isNonNullExpression(input) &&
            ts.isElementAccessExpression(input.expression)
        ) {
            argumentAccessOptional = true;
            return processInner(input.expression)
        } else if (
            ts.isElementAccessExpression(input) &&
            ((ts.isNonNullExpression(input.expression) &&
                ts.isPropertyAccessExpression(input.expression.expression)) ||
                ts.isPropertyAccessExpression(input.expression))
        ) {
            propIdentifier = emptyPropidentifier();
            propIdentifier.access = [
                {
                    name: input.argumentExpression.getText(),
                    exp: input.argumentExpression,
                    type: MetaType.UNKNOWN
                }
            ];
            if (argumentAccessOptional) {
                propIdentifier.isOptionalAccess = true;
                argumentAccessOptional = false;
            }
            return processInner(input.expression);
        } else if (
            ts.isElementAccessExpression(input) &&
            (ts.isElementAccessExpression(input.expression) ||
                (ts.isNonNullExpression(input.expression) &&
                    ts.isElementAccessExpression(input.expression.expression)))
        ) {
            // multiple element access this.a[0][1]
            const { access, exp } = processMultipleElementAccess(input);
            propIdentifier = emptyPropidentifier();
            propIdentifier.access = access.map((a, index) => {
                return { ...a, type: MetaType.UNKNOWN };
            });
            return processInner(exp)
        } else {
            throw new Error(`processThisResult ${exp.getText()} not supported`)
        }
    }
    processInner(exp)
    console.log("Processed values : ", values);
    if (!onlyThisInput) {
        values.forEach(v => {
            const type = getTypeForPropertyAccess(v.name.split("."))
            const tpeStr = AstUtils.typeToString(type)
            console.log("tpeStr : ", tpeStr);
            let metaType = MetaType.UNKNOWN
            if (AstUtils.isArrayType(AstUtils.getNonNullableType(type))) {
                metaType = MetaType.ARRAY
            } else {
                metaType = MetaType.OBJECT
            }
            v.meta.type = metaType
            let isOptionalType = false
            if (isUnionType(type)) {
                const ul = type.types[0] // TODO cross check its returning  union memebers in reverse order :s 
                type.types.forEach(m => {
                    console.log("Union Memebers ", AstUtils.typeToString(m));
                })
                const ulStr = AstUtils.typeToString(ul).trim()
                console.log("Union Type : ", ulStr);
                isOptionalType = ulStr === "null" || ulStr === "undefined"
            }
            v.meta.isTypeOptional = isOptionalType
            if (v.meta.access && v.meta.access.length > 1) { //TODO multiple element access 

            }
        })
    }
    const result: ProcessThisResult = { group: group, value: values[0].name, values }
    console.log("Process this result : ", result);
    return result;
}


// function processThisStatement(
//     exp: ts.PropertyAccessExpression | ts.ElementAccessExpression,
//     arrayMut?: boolean
// ): ProcessThisResult {
//     console.log("processTHis Statemenut input : ", exp.getText(), ts.isPropertyAccessExpression(exp), "arrayArg", arrayMut);
//     const values: MetaValue[] = [];
//     let propIdentifier: Omit<Meta, "type"> = {};
//     let argumentAccessOptional = false;
//     const procesThisResult = (parent: string) => {
//         let v = parent;
//         let isObject = false;
//         // console.log("Parent2 : ", v, "values: ", values);
//         if (values.length > 0) {
//             isObject = true;
//             // console.log("before splice : ", arrayMut, values);
//             if (!arrayMut) values.splice(0, 1);
//             if (values.length > 0) {
//                 values.forEach(v => {
//                     v.name = `${parent}.${v.name}`;
//                     if ((v.meta.access || arrayMut) && isArrayPropAccess(v.name)) {
//                         v.meta.type = MetaType.ARRAY;
//                     } else if (v.meta.access?.length && v.meta.access.length > 1) {
//                         // multiple prop access
//                         if (
//                             v.meta.access.filter(
//                                 a => a.exp.kind === ts.SyntaxKind.Identifier
//                             ).length > 0
//                         ) {
//                             throw new Error("dynamic identifier access not supported");
//                         }
//                         v.meta.access = typeOfMultipleArray(v.meta.access, v.name);
//                     }
//                 });
//                 v = values[0].name;
//             }
//             // console.log("after  splice : ", arrayMut, values);
//         }
//         const isArray =
//             propIdentifier.access || arrayMut ? isArrayPropAccess(parent) : false;
//         const t = isArray
//             ? MetaType.ARRAY
//             : isObject
//                 ? MetaType.OBJECT
//                 : MetaType.UNKNOWN;
//         values.push({ name: parent, meta: { ...propIdentifier, type: t } });
//         const result = { g: parent, v, values };
//         console.log("processThisStatement Result :", result);
//         return result;
//     }
//     const processInner = (
//         input: ts.PropertyAccessExpression | ts.ElementAccessExpression
//     ): ProcessThisResult => {
//         console.log("process Inner : ", ts.isPropertyAccessExpression(input));
//         if (ts.isThisTypeNode(input)) {
//             return procesThisResult(input.parent.getText())
//         }
//         else if (ts.isPropertyAccessExpression(input)) {
//             console.log("process Inner : ");
//             const parent = input.name.getText()
//             if (input.expression.kind === ts.SyntaxKind.ThisKeyword) {
//                 let v = parent;
//                 let isObject = false;
//                 // console.log("Parent2 : ", v, "values: ", values);
//                 if (values.length > 0) {
//                     isObject = true;
//                     // console.log("before splice : ", arrayMut, values);
//                     if (!arrayMut) values.splice(0, 1);
//                     if (values.length > 0) {
//                         values.forEach(v => {
//                             v.name = `${parent}.${v.name}`;
//                             if ((v.meta.access || arrayMut) && isArrayPropAccess(v.name)) {
//                                 v.meta.type = MetaType.ARRAY;
//                             } else if (v.meta.access?.length && v.meta.access.length > 1) {
//                                 // multiple prop access
//                                 if (
//                                     v.meta.access.filter(
//                                         a => a.exp.kind === ts.SyntaxKind.Identifier
//                                     ).length > 0
//                                 ) {
//                                     throw new Error("dynamic identifier access not supported");
//                                 }
//                                 v.meta.access = typeOfMultipleArray(v.meta.access, v.name);
//                             }
//                         });
//                         v = values[0].name;
//                     }
//                     // console.log("after  splice : ", arrayMut, values);
//                 }
//                 const isArray =
//                     propIdentifier.access || arrayMut ? isArrayPropAccess(parent) : false;
//                 const t = isArray
//                     ? MetaType.ARRAY
//                     : isObject
//                         ? MetaType.OBJECT
//                         : MetaType.UNKNOWN;
//                 values.push({ name: parent, meta: { ...propIdentifier, type: t } });
//                 const result = { g: parent, v, values };
//                 console.log("processThisStatement Result :", result);
//                 return result;
//                 // return procesThisResult(input.expression.parent.getText());
//             }
//             // console.log("Processing parent2: ", parent);
//             values.forEach(v => {
//                 v.name = `${parent}.${v.name}`;
//             });
//             values.push({
//                 name: parent,
//                 meta: { ...propIdentifier, type: MetaType.UNKNOWN }
//             });
//             propIdentifier = {};
//             return processInner(input.expression as any);
//         } else if (
//             ts.isNonNullExpression(input) &&
//             ts.isPropertyAccessExpression(input.expression)
//         ) {
//             const parent = input.expression.name.getText();
//             // console.log("Processing parent : ", parent);
//             values.forEach(v => {
//                 v.name = `${parent}.${v.name}`;
//             });
//             values.push({
//                 name: parent,
//                 meta: { ...propIdentifier, type: MetaType.UNKNOWN, isOptional: true }
//             });
//             if (parent === "arr2") {
//                 console.log(
//                     "*********** Arr2 : ",
//                     propIdentifier,
//                     values[values.length - 1]
//                 );
//             }
//             propIdentifier = {};

//             return processInner(input.expression.expression as any);
//         } else if (
//             ts.isNonNullExpression(input) &&
//             ts.isElementAccessExpression(input.expression)
//         ) {
//             console.log(
//                 "*****Argument Access Optional : ",
//                 argumentAccessOptional,
//                 input.getText()
//             );
//             argumentAccessOptional = true;
//             return processInner(input.expression as any);
//         } else if (
//             ts.isElementAccessExpression(input) &&
//             ((ts.isNonNullExpression(input.expression) &&
//                 ts.isPropertyAccessExpression(input.expression.expression)) ||
//                 ts.isPropertyAccessExpression(input.expression))
//         ) {
//             //TODO this.prop[_]
//             propIdentifier = {};
//             propIdentifier.access = [
//                 {
//                     name: input.argumentExpression.getText(),
//                     exp: input.argumentExpression,
//                     type: MetaType.UNKNOWN
//                 }
//             ];
//             if (argumentAccessOptional) {
//                 propIdentifier.isOptional = true;
//                 argumentAccessOptional = false;
//             }
//             return processInner(input.expression as any);
//         } else if (
//             ts.isElementAccessExpression(input) &&
//             (ts.isElementAccessExpression(input.expression) ||
//                 (ts.isNonNullExpression(input.expression) &&
//                     ts.isElementAccessExpression(input.expression.expression)))
//         ) {
//             // multiple element access this.a[0][1]
//             console.log(
//                 "********* Got multiple access ********",
//                 argumentAccessOptional,
//                 input.getText()
//             );
//             const { access, exp } = processMultipleElementAccess(input);
//             propIdentifier = {};
//             propIdentifier.access = access.map((a, index) => {
//                 return { ...a, type: MetaType.UNKNOWN };
//             });

//             console.log(
//                 "********** got multiple access *******",
//                 propIdentifier.access,
//                 propIdentifier.isOptional,
//                 exp.getText()
//             );
//             // if (ts.isNonNullExpression(exp)) {
//             //   console.log("***** Optional found : ");
//             //   propIdentifier.isOptional = true;
//             //   return processInner(exp.expression as any);
//             // }
//             return processInner(exp as any);
//         } else {
//             throw new Error(`${exp.getText()} ${input.getText()} is not supported.`);
//         }
//     };
//     return processInner(exp);
// }

type MultipleAccessReturn = { access: EAccess[]; exp: ts.Expression };

function processMultipleElementAccess(
    input: ts.ElementAccessExpression
): MultipleAccessReturn {
    const a: EAccess[] = [];
    function processMultipleElementAccessInner(
        i: ts.PropertyAccessExpression | ts.ElementAccessExpression
    ): MultipleAccessReturn {
        if (ts.isElementAccessExpression(i)) {
            a.push({
                name: i.argumentExpression.getText(),
                exp: i.argumentExpression,
                type: MetaType.UNKNOWN
            });
            return processMultipleElementAccessInner(i.expression as any);
        } else if (
            ts.isNonNullExpression(i) &&
            ts.isElementAccessExpression(i.expression)
        ) {
            a.push({
                name: i.expression.argumentExpression.getText(),
                isOptional: true,
                exp: i.expression.argumentExpression,
                type: MetaType.UNKNOWN
            });
            return processMultipleElementAccessInner(i.expression.expression as any);
        }
        return { access: a, exp: i };
    }

    return processMultipleElementAccessInner(input as any);
}

export function groupBy<T, K extends keyof T>(
    objectArray: T[],
    property: K,
    value: K | undefined
) {
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

export function groupByValue<T extends { value: any }>(
    objectArray: T[],
    property: keyof T
): Record<string, string[]> {
    return objectArray.reduce(function (acc: any, obj) {
        var key = obj[property];
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(obj.value);
        return acc;
    }, {});
}


