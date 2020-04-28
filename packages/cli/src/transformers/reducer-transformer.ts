import * as ts from "typescript";
import {
    LocalPropertyDecls, EAccess, MetaValue, Meta, ReducersMeta, AsyncTypes, TypeSafeStoreConfig, TypeSafeStoreConfigExtra, HttpUrlConfig,
    MetaType, NewValue, GS, ProcessThisResult
} from "../types";
import {
    T_STORE_ASYNC_TYPE, REDUCERS_FOLDER, GENERATED_FOLDER,
    TSTORE_TEMP_V, EMPTY_REDUCER_TRANFORM_MESSAGE, GEN_SUFFIX, WORKER_STATE_EXTRACTOR_FUNCTION_NAME
} from "../constants";
import { sep, relative } from "path";
import { ConfigUtils } from "../utils/config-utils";
import { AstUtils } from "../utils/ast-utils";
import { FileUtils } from "../utils/file-utils";
import { CommonUtils } from "../utils/common-utils";
import { performance } from "perf_hooks"
import { isUnionType, isObjectType } from "tsutils/typeguard/type"
import chalk = require("chalk");
import { WorkersUtils } from "../workers";
import { FetchActionMeta } from "../../../store/src";
import { type } from "os";




const STATE_PARAM_NAME = "_trg_satate"
const ACTION_PARAM_NAME = "_trg_action"
const WORKER_RESPONSE_PARAM_NAME = "_wr"

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
            imports.push(`import { ReducerGroup,FetchVariants,PromiseData,FetchRequest } from "@typesafe-store/store"`)
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
        WorkersUtils.createWorkersFile()
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

const TSPERSIST_TYPE = "TSPersist"
const TSDONTPERSIST_TYPE = "TSDontPersist"
const getPersistMeta = (): string | undefined => {
    let result: string | undefined = undefined
    const persistMode = ConfigUtils.getPeristMode()
    const isPersistDontPersistNode = (node: ts.Node): typeof TSPERSIST_TYPE | typeof TSDONTPERSIST_TYPE | undefined => {
        const t = node.getText()
        if (t === TSDONTPERSIST_TYPE || t === TSDONTPERSIST_TYPE) {
            return t;
        } else {
            return undefined;
        }
    }
    const hc = classDecl.heritageClauses
    if (hc) {
        const ic = hc.filter(hc => ts.isInterfaceDeclaration(hc.parent))[0]
        if (ic) {
            let v: typeof TSPERSIST_TYPE | typeof TSDONTPERSIST_TYPE | undefined = undefined
            ic.types.some(t => {
                const text = isPersistDontPersistNode(t.expression)
                if (text) {
                    v = text
                    return true
                }
            })
            if (v) {
                if (!persistMode) {
                    throw new Error(`You should specify persistMode in tsconfig.json "typesafe-store" field  inorder to use ${TSDONTPERSIST_TYPE}/${TSPERSIST_TYPE} interfaces`)
                } else if (persistMode === "epxlicitPersist" && v === TSDONTPERSIST_TYPE) {
                    throw new Error(`You choosen persist mode as "epxlicitPersist"  but using ${TSDONTPERSIST_TYPE} which does nothing  probaly you mean ${TSPERSIST_TYPE} `)
                } else if (persistMode === "explicitDontPersist" && v === TSPERSIST_TYPE) {
                    throw new Error(`You choosen persist mode as "explicitDontPersist"  but using ${TSPERSIST_TYPE} which does nothing  probaly you mean ${TSDONTPERSIST_TYPE} `)
                }
                result = persistMode === "epxlicitPersist" ? "persist:true" : "dpersist:ture"
            }
        }
    }
    if (!result) {
        const props: { name: string, tpe: string }[] = []
        propDecls.forEach(p => {
            const typeNode = p.pd.type
            const name = p.pd.name.getText()
            if (typeNode) {
                const tpdText = isPersistDontPersistNode(typeNode)
                if (tpdText) {
                    props.push({ name, tpe: tpdText })
                } else if (ts.isIntersectionTypeNode(typeNode)) {
                    typeNode.types.some(itn => {
                        const itnText = isPersistDontPersistNode(itn)
                        if (itnText) {
                            props.push({ name, tpe: itnText })
                            return true
                        }
                    })
                }
            }
        })
        if (props.length > 0 && !persistMode) {
            throw new Error(`You should specify persistMode in tsconfig.json "typesafe-store" field  inorder to use ${TSDONTPERSIST_TYPE}/${TSPERSIST_TYPE} interfaces`)
        } else {
            const rp: string[] = []
            props.forEach(p => {
                const v = p.tpe
                if (persistMode === "epxlicitPersist" && v === TSDONTPERSIST_TYPE) {
                    throw new Error(`You choosen persist mode as "epxlicitPersist"  but using ${TSDONTPERSIST_TYPE} on field ${p.name} which does nothing  probaly you mean ${TSPERSIST_TYPE} `)
                } else if (persistMode === "explicitDontPersist" && v === TSPERSIST_TYPE) {
                    throw new Error(`You choosen persist mode as "explicitDontPersist"  but using ${TSPERSIST_TYPE} on field ${p.name} which does nothing  probaly you mean ${TSDONTPERSIST_TYPE} `)
                }
                rp.push(p.name)
            })
            const keys = JSON.stringify(rp)
            result = persistMode === "epxlicitPersist" ? `persistKeys:${keys}` : `dpersistKeys:${keys}`
        }
    }
    return result;
}

const getSetsAndMapsFromType = (tpe: ts.Type, parent: string): { name: string, path: string, type: "Set" | "Map" }[] => {
    const result: { name: string, path: string, type: "Set" | "Map" }[] = []
    tpe = tpe.getNonNullableType()
    const tpeStr = AstUtils.typeToString(tpe)
    if (tpeStr === "string" || tpeStr === "number" || tpeStr)
        if (tpeStr.startsWith("Set<")) {
            result.push({ name, path: name, type: "Set" })
        } else if (tpeStr.startsWith("Map<")) {
            result.push({ name, path: name, type: "Map" })
        } else {
            let props: ts.Symbol[] = []
            if (AstUtils.isArrayType(tpe)) {
                const it = tpe.getNumberIndexType()
                const results = []
            }
            //   props = !.getProperties()
            // } else  {
            //    props = 
            // }
            // if ()
            //     tpe.getNonNullableType().getProperties().forEach(p => {

            //     })
        }

    return result;

}

const getSetAndMapMetaData = (): string | undefined => {
    let result: string | undefined = undefined
    const persistMode = ConfigUtils.getPeristMode()
    if (persistMode) {
        const props: { name: string, path: string, type: "Set" | "Map" }[] = []
        propDecls.filter(p => !isAsyncPropDeclaration(p)).forEach(p => {
            const tpeStr = p.typeStr
            const type = p.typeStr
            const name = p.pd.name.getText()
            if (tpeStr.startsWith("Set<")) {
                props.push({ name, path: name, type: "Set" })
            } else if (tpeStr.startsWith("Map<")) {
                props.push({ name, path: name, type: "Set" })
            } else {

            }
        })
    }
    return result
}


//constants

const createReducerFunction = (cd: ts.ClassDeclaration) => {
    setClassDeclaration(cd);
    const defaultState = getDefaultState(propDecls);
    const typeName = getTypeName();
    const group = `${ConfigUtils.getPrefixPathForReducerGroup(currentProcessingReducerFile)}${typeName}`;
    const stateName = `${typeName}State`
    const methodsResults = processMethods({ group, stateName });
    const offloadMethodResult = methodsResults.filter(mr => mr.offload)
    const stateType = getStateType(offloadMethodResult.map(mr => mr.actionType.name))
    const syncMeta = offloadMethodResult.map(mr => ({ name: mr.actionType.name, value: `{offload:${mr.offload}}` }))
    let [asyncActionType, asyncMeta] = getAsyncActionTypeAndMeta(group);
    let persistMeta: string | undefined = getPersistMeta()
    let result = ts.createIdentifier("")
    if (methodsResults.length === 0 && asyncActionType === "") { // If no async properties and methods then return empty node
        result = ts.createIdentifier(EMPTY_REDUCER_TRANFORM_MESSAGE)
    } else {
        const caseClauses = methodsResults.map(mr => mr.caseStatement)
        const f = buildFunction({ caseClauses, typeName });

        let actionType = methodsResults.map(mt => {
            const at = mt.actionType
            let result = ""
            if (at.payload) {
                result = `{name: "${at.name}" ,group :"${at.group}",payload:${at.payload}}`
            } else {
                result = `{name: "${at.name}" ,group :"${at.group}"}`
            }
            return result
        }).join(" | ")
        if (actionType === "") {
            actionType = `{name:"no_sync_reducers",group:"${group}"}`
        }
        if (asyncActionType === "") {
            asyncActionType = `undefined`
        }

        const meta = `{async:undefined,a:{${[...syncMeta, ...asyncMeta].map(m => `${m.name}:${m.value}`).join(",")}}${persistMeta ? `,${persistMeta}` : ""}}`
        result = ts.createIdentifier(
            `
           export type ${stateName} = ${stateType}
           
           export type ${typeName}Action = ${actionType}
  
           export type ${typeName}AsyncAction = ${asyncActionType}

           export type ${typeName}GroupType =  ReducerGroup<${typeName}State,${typeName}Action,"${typeName}",${typeName}AsyncAction>
  
           export const ${typeName}Group: ${typeName}GroupType  = { r: ${f},g:"${typeName}",ds:${defaultState},m:${meta}}
  
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
const processMethods = ({ group, stateName }: { group: string, stateName: string }): { actionType: ActionType, caseStatement: string, offload?: string }[] => {

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
                    const oldAccess = oldValue.get(v)
                    if (oldAccess) {
                        duplicateExists = true;
                        const oldValues = oldAccess.values
                        oldValues.forEach((ov, i) => {
                            if (ov.meta.type === MetaType.ARRAY && ov.meta.access && ov.meta.access[0].name !== values[i].meta.access![0].name) { // meaning  user tried to modify array with different indexes in different places ,(this.a[1].name = "", this.a[0].name ="")
                                throw new Error(`Mutating same array ${ov}  in with different indexes is not supported`)
                            }
                        })
                    }
                    parentGroups.set(g, oldValue.set(v, { values, newValue }));
                }
            };
            const payload = getPayloadForClassMethod(m)

            let actionType: ActionType = null as any

            if (payload.length) {
                actionType = { group, name, payload }
            } else {
                actionType = { group, name }
            }
            const paramsLenth = m.parameters.length;
            if (paramsLenth > 0) {
                const payloadType = actionType.payload!
                let v = "";
                if (paramsLenth === 1) {
                    v = `const ${m.parameters[0].name.getText()} = (${ACTION_PARAM_NAME} as any).payload as (${payloadType})`;
                } else {
                    v = `const { ${m.parameters
                        .map(p => p.name.getText())
                        .join(",")} } = (${ACTION_PARAM_NAME} as any).payload as (${payloadType})`;
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
                    const thisResult = processThisStatement(processInput);
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

                    let newStatement = s.getText()
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
                    const thisResult = processThisStatement((left as ts.PropertyAccessExpression).expression as any);
                    const exprLeft = left.getText();
                    let exprRight = s.expression.right.getText()
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
                    let newStatement = `${exprLeft} ${op} ${exprRight}`
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
                    const thisResult = processThisStatement(exp.expression as any);
                    let args = s.expression.arguments.map(a => a.getText()).join(",");
                    let modifiedField = getModifiedField(exp.expression)
                    let newValue = {
                        name: modifiedField,
                        op: s.expression.expression.name.getText(),
                        value: ""
                    };

                    newValue.value = args;
                    let newStatement = s.getText()
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
                        (s.expression.expression.name.getText() === "forEach" || s.expression.expression.name.getText() === "some")) {
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
                const caseStatement = `case "${name}" : {
                    ${reservedStatements.join("\n")}
                    return { ...${STATE_PARAM_NAME}, ${propertyAssignments.join(",")} }
                }`;
                return { actionType, caseStatement, }
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



            const getStringVersionOfForEachStatementResult = (fsr: ForEachStatementResult, offload?: boolean): string => {

                const ce = fsr.statement.expression as ts.CallExpression
                const v = offload ? replaceThisWithStateOffload(ce.expression) : replaceThisWithState(ce.expression)
                let functionBody = ""
                const arg = ce.arguments[0]
                if (ts.isArrowFunction(arg)) {
                    const af = arg
                    const params = af.parameters.map(p => p.getText()).join(" ,")
                    functionBody = `(${params}) => {
                       ${offload ? getOutputStatementsOffload(fsr.statementResults).join("\n") : getOutputStatements(fsr.statementResults).join("\n")}
                    }`
                } else if (ts.isFunctionExpression(arg)) {
                    const fe = arg
                    const params = fe.parameters.map(p => p.getText()).join(" ,")
                    functionBody = `
                      function (${params}) {
                        ${offload ? getOutputStatementsOffload(fsr.statementResults).join("\n") : getOutputStatements(fsr.statementResults).join("\n")}
                      }
                    `
                }
                const result = `
                   ${v}(${functionBody})
                `
                return result;
            }

            const getStringVersionOfIfStatementResult = (isr: IfStatementResult, offload?: boolean) => {
                const is = isr.statement
                let body = ""
                if (ts.isBlock(is.thenStatement)) {
                    body = `{  
                        ${offload ? getOutputStatementsOffload(isr.statementResults).join("\n") : getOutputStatements(isr.statementResults).join("\n")}
                    }`
                } else {
                    body = `${offload ? getOutputStatementsOffload(isr.statementResults).join("\n") : getOutputStatements(isr.statementResults).join("\n")}`
                }
                const result = `
                  if(${offload ? replaceThisWithStateOffload(is.expression) : replaceThisWithState(is.expression)}) ${body}
                `
                return result;
            }

            const getStringVersionOfIfElseStatementResult = (iesr: IfElseStatementResult, offload?: boolean): string => {
                const ies = iesr.statement

                const ifCond = offload ? replaceThisWithStateOffload(ies.expression) : replaceThisWithState(ies.expression)
                let ifBody = ""
                if (ts.isBlock(ies.thenStatement)) {
                    ifBody = `{  
                        ${offload ? getOutputStatementsOffload(iesr.ifStatementResults).join("\n") : getOutputStatements(iesr.ifStatementResults).join("\n")}
                    }`
                } else {
                    ifBody = `${offload ? getOutputStatementsOffload(iesr.ifStatementResults).join("\n") : getOutputStatements(iesr.ifStatementResults).join("\n")}`
                }
                const elseS = ies.elseStatement!
                let else_str = ""
                if (ts.isBlock(elseS) || isSupportedMutationStatement(elseS)) {
                    else_str = `else {
                         ${offload ? getOutputStatements(iesr.elseStatementResults).join("\n") : getOutputStatements(iesr.elseStatementResults).join("\n")}
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

            const replaceThisWithStateOffloadText = (str: String) => {
                return str.replace(/this\./g, `${STATE_PARAM_NAME}.`)
            }

            const replaceThisWithStateOffload = (node: ts.Node) => {
                return replaceThisWithStateOffloadText(node.getText())
            }

            const getOutputStatementsOffload = (input: StatementResult[]): string[] => {
                const results: string[] = []
                input.forEach(sr => {
                    if (sr.kind === "MutationStatement") {
                        results.push(replaceThisWithStateOffloadText(sr.newStatement))
                    } else if (sr.kind === "GeneralStatement") {
                        console.log("general statement : ", sr.statement.getText());
                        results.push(replaceThisWithStateOffload(sr.statement))
                    } else if (sr.kind === "TerinaryStatement") {
                        const ts = sr.statement
                        const ce = ts.expression as ts.ConditionalExpression
                        const ts_string = `${replaceThisWithStateOffload(ce.condition)} ? ${sr.trueExp.newStatement} : ${sr.falseExp.newStatement}`
                        results.push(ts_string)
                    } else if (sr.kind === "ForEachStatement") {
                        const fs_string = getStringVersionOfForEachStatementResult(sr, true)
                        results.push(fs_string)
                    } else if (sr.kind === "IfStatement") {
                        const is_string = getStringVersionOfIfStatementResult(sr, true)
                        results.push(is_string)
                    } else if (sr.kind === "IfElseStatement") {
                        const ies_string = getStringVersionOfIfElseStatementResult(sr, true)
                        results.push(ies_string)
                    }
                })
                return results
            }
            let offload: string | undefined = undefined
            if (m.type && m.type.getText() === "Offload") { // we need to offload this action
                const offloadOutputStatements = getOutputStatementsOffload(statementsResults)
                offload = createOffloadFunction({ m, mutationParentGroup: parentGroups, offloadOutputStatements, group, stateName })
            } else { // remove if already exist
                WorkersUtils.removeWorkerFunction(name, group)
            }

            const caseStatement = `case "${name}" : {
                ${reservedStatements.join("\n")}
                ${outputStatements.join("\n")}
                return { ...${STATE_PARAM_NAME}, ${propertyAssignments.join(",")} }
            }`;

            return { actionType, caseStatement, offload }
        });
};


const createOffloadFunction = ({ m, mutationParentGroup, offloadOutputStatements, stateName, group }: {
    m: ts.MethodDeclaration, mutationParentGroup: Map<string, Map<string, ParentGroupValue>>,
    offloadOutputStatements: string[], stateName: string, group: string
}) => {
    const parentGroup: Map<
        string,
        Map<string, MetaValue[]>> = new Map()
    const name = m.name.getText()
    const isThisAccessnode = (node: ts.Node) => {
        const nt = node.getText()
        return nt.startsWith("this.") && ts.isPropertyAccessExpression(node.parent)
    }
    const thisNodes = AstUtils.findAllNodesInsideNode(m, isThisAccessnode)
    thisNodes.forEach(n => {
        console.log("thisNode ", n.getText(), n.kind, n.parent.getText())
        const { group, value, values } = processThisStatementOffload(n.parent)
        const ev = parentGroup.get(group)
        if (ev) {
            ev.set(value, values)
        } else {
            const m = new Map()
            m.set(value, values)
            parentGroup.set(group, m)
        }
    })

    const stateToWorkerInStateAssignments: string[] = []
    for (const [key, value] of parentGroup) {
        stateToWorkerInStateAssignments.push(`${key}: ${selectObjectList(value)}`)
    }

    const stateToWorkerIn = `
      (${STATE_PARAM_NAME}: ${stateName}) => {
          return {${stateToWorkerInStateAssignments.join(",")}}
      }
    `

    const newMutationParentGroup: Map<string, Map<string, ParentGroupValue>> = new Map()
    const finalPropertyAccess: string[] = []

    for (const [key, value] of mutationParentGroup) {
        const newMap = new Map<string, ParentGroupValue>()
        const setNewAccessName = ({ newAccessName, values }: { newAccessName: string, values: MetaValue[], }) => {
            finalPropertyAccess.push(newAccessName)
            const newAccessNameA = newAccessName.split(".")
            const nvName = newAccessNameA[newAccessName.length - 1]
            newAccessNameA.pop()
            newMap.set(newAccessNameA.join("."), {
                values,
                newValue: {
                    name: nvName, op: "",
                    value: `${WORKER_RESPONSE_PARAM_NAME}["${newAccessName}"]`
                }
            })
        }
        for (const [pk, pv] of value) {
            const mvs = pv.values;
            const newMvs: MetaValue[] = [];
            [...mvs].reverse().some(mv => {
                if (mv.meta.access) {
                    return true
                }
                newMvs.unshift(mv)
            })
            if (mvs.length === newMvs.length) {
                if (mvs[0].meta.type === MetaType.ARRAY && arrayMutableMethods.includes(pv.newValue.op)) {
                    setNewAccessName({ newAccessName: mvs[0].name, values: mvs })
                } else if (pv.newValue.name.startsWith("[") && isNaN(parseInt(pv.newValue.name.slice(1, -1), 10))) { // identifier access

                    setNewAccessName({ newAccessName: mvs[0].name, values: mvs })
                } else {
                    const newAccessname = `${mvs[0].name}.${pv.newValue.name}`
                    finalPropertyAccess.push(newAccessname)
                    const nv = `${WORKER_RESPONSE_PARAM_NAME}["${newAccessname}"]`
                    newMap.set(pk, { values: mvs, newValue: { ...pv.newValue, value: nv } })
                }

            } else {
                setNewAccessName({ newAccessName: newMvs[0].name, values: newMvs })
            }
        }
        newMutationParentGroup.set(key, newMap)
    }

    const workerResponseToStatePropertyAssignments: string[] = []

    for (const [key, value] of newMutationParentGroup) {
        workerResponseToStatePropertyAssignments.push(`${key}: ${invalidateObjectWithList({ input: value })}`)
    }

    const workerResponseToState = `
       (${STATE_PARAM_NAME}: ${stateName},${WORKER_RESPONSE_PARAM_NAME}:any) => {
          return {...${STATE_PARAM_NAME},${workerResponseToStatePropertyAssignments.join(", ")} }
       }
    `

    const pa = m.parameters.length === 0 ? "" : `const {${m.parameters
        .map(p => p.name.getText())
        .join(",")}} = _input.payload;`

    const workerFunction = `
      function ${WorkersUtils.createFunctionNameFromGroup(name, group)}(_input:any) {
         const ${STATE_PARAM_NAME} = _input.${STATE_PARAM_NAME}
         ${pa}
         ${offloadOutputStatements.join("\n")}
         return ${WORKER_STATE_EXTRACTOR_FUNCTION_NAME}(${STATE_PARAM_NAME},_input.propAccessArray)
      }
    `
    WorkersUtils.addWorkerFunction({ name, code: workerFunction, group })

    return `{
        stateToWorkerIn: ${stateToWorkerIn},
        workerResponseToState: ${workerResponseToState},
        propAccessArray: ${JSON.stringify(finalPropertyAccess)}
    }`

}



const selectObjectList = (input: Map<string, MetaValue[]>, traversed: string[] = [], parent: string = STATE_PARAM_NAME): string => {
    const entries = Array.from(input.entries())
    const first = entries[0]
    if (input.size === 1) {
        const key = first[0]
        const v = first[1]
        return selectObject(key.split("."), v, [], parent)
    } else {
        const v1 = first[0].split(".")[0]
        const v = traversed.length > 0 ? `${traversed.join(".")}.${v1}` : v1
        let m: Meta = null as any
        const newP = `${parent}.${v1}`
        const obj: Record<string, Map<string, MetaValue[]>> = {}
        entries.filter(([key, value]) => key.split(".").length > 1)
            .forEach(([key, value]) => {
                const ka = key.split(".")
                const k1 = ka[1]
                const ev = obj[k1]
                if (!m) {
                    const tf = value.find(m => m.name === v)
                    if (tf) {
                        m = tf.meta
                    }
                }
                if (ev) {
                    ev.set(ka.slice(1).join("."), value)
                } else {
                    const m = new Map()
                    m.set(ka.slice(1).join("."), value)
                    obj[k1] = m
                }
            })
        console.log("Object : ", obj);
        const r = `{${Object.keys(obj).map(s => `${s}:${selectObjectList(obj[s], traversed.concat(v1), newP)}`).join(", ")}}`
        const isOptioal = m.isOptionalAccess || m.isTypeOptional
        return isOptioal ? `${newP} ? ${r} : ${newP}` : r
    }
}

const selectObject = (inp: string[], values: MetaValue[], traversed: { name: string, access?: string }[] = [], parent: string = "state"): string => {
    console.log("selectObject Input : ", inp, values, parent);
    const v1 = inp[0]
    let vv1 =
        traversed.length > 0
            ? `${traversed.map(t => t.name).join(".")}.${v1}`
            : `${v1}`;
    const ps = parent.split(".")
    if (ps.length > 1) {
        vv1 = `${ps.slice(1).join(".")}.${vv1}`
    }
    const vv1tM = values.find(v => v.name === vv1)!
    const v =
        traversed.length > 0
            ? `${parent}.${traversed
                .map(t => (t.access ? `${t.name}${t.access}` : t.name))
                .join(".")}.${v1}`
            : `${parent}.${v1}`;
    if (inp.length === 1) {
        return v;
    } else {
        const v2 = inp[1]
        const v2Exapnd = selectObject(inp.slice(1), values, traversed.concat({ name: v1 }), parent)
        const r = `{${v2}: ${v2Exapnd}}`
        const isOptional = vv1tM.meta.isOptionalAccess || vv1tM.meta.isTypeOptional
        return isOptional ? `${v} ? ${r} : ${v} ` : r
    }

}

const invalidateObjectWithList = ({
    input,
    traversed = [],
    parent = STATE_PARAM_NAME
}: {
    input: Map<string, ParentGroupValue>;
    traversed?: { name: string, access?: string }[];
    parent?: string;
}): string => {
    const entries = Array.from(input.entries());
    const first = entries[0]
    if (input.size === 1) {
        const [key, value] = first;
        const v =
            traversed.length > 0 ? `${parent}.${traversed.map(t => (t.access ? `${t.name}${t.access}` : t.name)).join(".")}` : `${parent}`;
        return invalidateObject({
            map: { input: key.split("."), values: value.values, newValue: value.newValue },
            parent: v
        });
    } else {
        const v1 = first[0].split(".")[0]
        const v = traversed.length > 0 ? `${traversed.map(t => t.name).join(".")}.${v1}` : v1
        let m: Meta = null as any
        const newP = traversed.length > 0
            ? `${parent}.${traversed
                .map(t => (t.access ? `${t.name}${t.access}` : t.name))
                .join(".")}.${v1}`
            : `${parent}.${v1}`;
        const obj: Record<string, Map<string, ParentGroupValue>> = {}
        entries.filter(([key, value]) => key.split(".").length > 1)
            .forEach(([key, value]) => {
                const ka = key.split(".")
                const k1 = ka[1]
                const ev = obj[k1]
                if (!m) {
                    const tf = value.values.find(m => m.name === v)!
                    m = tf.meta
                } else if (m) {
                    if (m.type === MetaType.ARRAY && m.access) {
                        const ntf = value.values.find(m => m.name === v)!
                        if (!ntf.meta.access || m.access[0].name !== ntf.meta.access[0].name) {
                            throw new Error(`Mutating same array in ${v} with different indexes is not supported`)
                        }
                    }
                }
                if (ev) {
                    ev.set(ka.slice(1).join("."), value)
                } else {
                    const m = new Map()
                    m.set(ka.slice(1).join("."), value)
                    obj[k1] = m
                }
            })
        console.log("Object : ", obj);

        const isOptioal = m.isOptionalAccess || m.isTypeOptional
        let r = ""
        let access = m.access?.[0].name
        if (m.isOptionalAccess) {
            access = access ? `![${access}]` : "!";
        } else {
            access = access ? `[${access}]` : undefined
        }
        const expand = Object.keys(obj).map(s => `${s}:${invalidateObjectWithList({ input: obj[s], traversed: traversed.concat({ name: v1, access }) })}`).join(", ")
        if (m.type === MetaType.ARRAY) {
            const obs = `{${expand}}`
            r = `[...${newP}.map((${TSTORE_TEMP_V},_i) => _i === ${m.access?.[0].name} ? ${obs} : ${TSTORE_TEMP_V})]`;
        } else {
            r = `{...${newP},${expand}}`
        }
        return isOptioal ? `${newP} ? ${r} : ${newP}` : r

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
        "parent : ",
        parent
    );
    const v1 = input[0];
    let vv1 =
        traversed.length > 0
            ? `${traversed.map(t => t.name).join(".")}.${v1}`
            : `${v1}`;
    const ps = parent.split(".")
    if (ps.length > 1) {
        vv1 = `${ps.slice(1).join(".")}.${vv1}`
    }
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
            let r = ""
            if (v1t.meta.access) {
                const access = v1t.meta.access[0].name
                r = `{ ...${v}, [${access}]: {...${v}[${access}],${newValue.name}:${newValue.value} }}`
            } else {
                r = `{...${v},${newValue.name}:${newValue.value}}`;
            }

            if (v1t.meta.isOptionalAccess || v1t.meta.isTypeOptional) {
                console.log(`Optional found1 : ,v1 = ${v1}, v = ${v}`);
                return `${v} ? ${r} : ${v}`;
            }
            return r;
        }
    } else {
        const v2 = input[1];
        const v2t = values.find(v => v.name === vv1)!;
        let access = v1t.meta.access?.[0].name
        if (v1t.meta.isOptionalAccess) {
            access = access ? `![${access}]` : "!";
        } else {
            access = access ? `[${access}]` : undefined
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
            if (access) {
                expand = `{ ...${v}, ${access}: {...${v}${access} ,${v2}:${v2exapnd}}  }`;
            } else {
                expand = `{ ...${v},${v2}:${v2exapnd} }`;
            }
            if (v1t.meta.isOptionalAccess || v1t.meta.isTypeOptional) {
                expand = `${v} ? ${expand} : ${v}`;
            }
        }
        if (v2t.meta.isOptionalAccess || v2t.meta.isTypeOptional) { //TODO testcase for this to triggger

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
    typeName: group
}: {
    caseClauses: string[];
    typeName: string;
}) {
    if (caseClauses.length > 0) {
        return `
    (${STATE_PARAM_NAME}:${group}State,${ACTION_PARAM_NAME}:${group}Action) => {
       const t = ${ACTION_PARAM_NAME}.name
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
    classDecl = null as any;
    members = null as any;
    memberTypes = null as any;
    propDecls = null as any;
    currentProcessingReducerFile = ""
}



const getStateType = (offloadMethods: string[]) => {
    return `{${propDecls
        .map(p => {
            const n = p.pd.name.getText();
            const tpe = p.typeStr

            let t = p.typeStr

            if (p.pd.type) { // Dont use tostring value as it fetches all values of types and we cant add individual imports  
                t = p.pd.type.getText()
            } else if (t === "string" || t === "number" || t === "boolean") {// if primitive fields we can depend on toString()
            }
            else {
                throw new Error('all fields of reducer should be annotated with type')
            }
            return `${n}${p.pd.questionToken ? "?" : ""}:${t}`;
        }).concat(offloadMethods.map(n => `${n} :{abortController?:AbortController,loading?:boolean, error?:Error,completed?:boolean}`))
        .join(",")}}`;
};

export const lastElementOfArray = <T>(a: T[]) => {
    return a[a.length - 1];
};




function getFetchRequestResponseType(response: string): FetchActionMeta["response"] {
    let result: FetchActionMeta["response"] = "json"
    if (response === "string") {
        result = "text"
    } else if (response === "void") {
        result = "void"
    } else if (response === "Blob") {
        result = "blob"
    } else if (response === "ArrayBuffer") {
        result = "arrayBuffer"
    }
    return result
}


const enttityTypeOps = ["AppendToList", "PrependToList",
    "UpdateList", "DeleteFromList", "AppendToListAndDiscard", "PrependToListAndDiscard",
    "UpdateListAndDiscard", "DeleteFromListAndDiscard",
    "PaginateAppend", "PaginatePrepend"]

const paginatedTypeOps = ["PaginateAppend", "PaginatePrepend"]

const isTypeOpsNode = (node: ts.Node) => {
    const t = node.getText()
    return enttityTypeOps.some(to => {
        if (t.startsWith(`${to}<`) || paginatedTypeOps.includes(t)) {
            return true;
        }
    })
}

const FETCHBODYTYPES_ARRAY = ["Blob", "BufferSource", "FormData", "URLSearchParams", "ReadableStream<Uint8Array>", "string"]

const getFetchBodyType = (input: string): FetchActionMeta["body"] => {
    let result: FetchActionMeta["body"] = "json"
    if (input === "Blob") {
        result = "blob"
    } else if (input === "BufferSource") {
        result = "blob"
    } else if (input === "FormData") {
        result = "form"
    } else if (input === "string") {
        result = "text"
    } else if (input === "URLSearchParams") {
        result = "urlsearch"
    } else if (input === "ReadableStream<Uint8Array>") {
        result = "blob"
    }
    return result
}


type ProcessFetchResult = {
    name: string,
    actionPayload: string,
    graphql?: string,
    bodyType?: string
    responseType: string, tf?: string, grpcMeta?: string,
    offload?: boolean,
    typeOps?: string
}

const processWebSocket = (lpd: LocalPropertyDecls, group: string): { meta: string, payload: String } => {
    console.log("******** processWebSocket");
    const fieldTypeNode = lpd.pd.type!
    let opNode: ts.TypeReferenceNode = fieldTypeNode as any
    if (ts.isIntersectionTypeNode(fieldTypeNode)) {
        opNode = fieldTypeNode.types[0] as any
    }
    const symb = AstUtils.getTypeChecker().getSymbolAtLocation(opNode.typeName)
    if (!symb) {
        throw new Error(`field ${group}.${lpd.pd.name} fist type should  be TSWebSocket`)
    }
    const decl = symb.declarations[0]
    const declTypeNode: ts.TypeReferenceNode = (decl as any).type
    const declTypeNodeText = declTypeNode.getText()
    let meta: { isGraphql?: boolean, dtf?: string } = {}
    const actionPayload = `NonNullable<${opNode.typeName.getText()}["_wsmeta"]>`
    if (declTypeNodeText.startsWith("GraphqlSubscription<")) {
        meta.isGraphql = true;
    }

    return { meta: JSON.stringify(meta), payload: actionPayload }

}



const processFetchProp2 = (lpd: LocalPropertyDecls, group: string): ProcessFetchResult => {
    const OFFLOAD_ASYNC = "OffloadAsync"
    let fieldTypeNode = lpd.pd.type!
    const name = lpd.pd.name.getText()
    let isGrpc = false
    if (!fieldTypeNode) {
        throw new Error(`You should specify type at field declation time`)
    }
    const fieldTypeNodeStr = lpd.pd.type!.getText()
    let opNode: ts.TypeReferenceNode = null as any
    if (ts.isIntersectionTypeNode(fieldTypeNode)) {
        opNode = fieldTypeNode.types[0] as any // in intersection types first node should be namespaced Fetch/Grpc/Graphql type
    } else {
        opNode = fieldTypeNode as any
    }
    const symb = AstUtils.getTypeChecker().getSymbolAtLocation(opNode.typeName)
    if (!symb) {
        throw new Error(`Type should be from namespace`)
    }
    const decl = symb.declarations[0] as any
    const declaredTypeNode = decl.type as ts.TypeReferenceNode
    const declaredTypeNodeText = declaredTypeNode.getText()
    let offload = false
    let transformFunctionQueryNode: ts.TypeQueryNode | undefined = undefined
    let grpcSerializeFnNode: ts.TypeQueryNode | undefined = undefined
    let grpcDeserializeFnNode: ts.TypeQueryNode | undefined = undefined
    let metaResponseType: FetchActionMeta["response"] = "blob"
    let graphql: string | undefined = undefined
    let typeOpNode: ts.TypeReferenceNode | undefined = undefined
    let bodyType: FetchActionMeta["body"] = undefined
    let responseTypeNode: ts.TypeNode = null as any
    let grpcMeta: string | undefined = undefined
    let actionPayload = `NonNullable<${opNode.typeName.getText()}["_fmeta"]>`
    let typeOpsResult: string | undefined = undefined;
    if (declaredTypeNodeText.startsWith("GRPCUnary<") || declaredTypeNodeText.startsWith("GRPCResponseStream<")) { // grpc 
        isGrpc = true;
        bodyType = "grpc"
        // let grpcOpNode: ts.TypeReferenceNode = null as any
        if (ts.isIntersectionTypeNode(fieldTypeNode)) {
            fieldTypeNode.types.forEach(t => {
                if (t.getText() === OFFLOAD_ASYNC) {
                    offload = true;
                } else if (isTypeOpsNode(t)) {
                    typeOpNode = t as any;
                }
            })
        }

        const opnodeTypeArgs = opNode.typeArguments!

        const declTypeArgs = declaredTypeNode.typeArguments!
        if (opnodeTypeArgs.length === 3) {
            transformFunctionQueryNode = opnodeTypeArgs[2] as any
        } else {
            responseTypeNode = declTypeArgs[2]
        }

        grpcSerializeFnNode = opnodeTypeArgs[0] as any
        grpcDeserializeFnNode = opnodeTypeArgs[1] as any
        if (declaredTypeNodeText.startsWith("GRPCResponseStream<")) {
            metaResponseType = "stream"
        } else {
            metaResponseType = "blob"
        }

    } else if (declaredTypeNodeText.startsWith("GraphqlQuery<") || declaredTypeNodeText.startsWith("GraphqlMutation<")) {
        if (ts.isIntersectionTypeNode(fieldTypeNode)) {
            fieldTypeNode.types.forEach(t => {
                if (t.getText() === OFFLOAD_ASYNC) {
                    offload = true;
                } else if (isTypeOpsNode(t)) {
                    typeOpNode = t as any;
                }
            })
        }
        graphql = `{}`;
        metaResponseType = "json"
        bodyType = "json"
        const declaredTypeArgument = declaredTypeNode.typeArguments!
        responseTypeNode = declaredTypeArgument[2];
        if (ts.isTupleTypeNode(responseTypeNode)) {
            graphql = `{multiOp:true}`
            if (typeOpNode) {
                throw new Error(`TypeOps are not supported on multi graphql operation`)
            }
        }

    }
    else if (declaredTypeNodeText.startsWith("Fetch<") || declaredTypeNodeText.startsWith("FetchPost<") || declaredTypeNodeText.startsWith("FetchPatch<") || declaredTypeNodeText.startsWith("FetchPut<")) {
        if (ts.isIntersectionTypeNode(fieldTypeNode)) {
            fieldTypeNode.types.forEach(t => {
                if (t.getText() === OFFLOAD_ASYNC) {
                    offload = true;
                } else if (isTypeOpsNode(t)) {
                    typeOpNode = t as any
                }
            })
        }
        if (opNode.typeArguments && opNode.typeArguments.length === 1) {
            transformFunctionQueryNode = opNode.typeArguments[0] as any
        }
        const declaredTypeArguments = declaredTypeNode.typeArguments!
        if (declaredTypeNodeText.startsWith("Fetch<")) {
            if (!transformFunctionQueryNode) {
                responseTypeNode = declaredTypeArguments[1]
            }
            metaResponseType = getFetchRequestResponseType(declaredTypeArguments[2].getText())

        } else {
            metaResponseType = getFetchRequestResponseType(declaredTypeArguments[3].getText())
            if (!transformFunctionQueryNode) {
                responseTypeNode = declaredTypeArguments[2]
            }
            bodyType = getFetchBodyType(declaredTypeArguments[1].getText())
        }
    } else {
        throw new Error(`fetch field should annotate with typename from a namespace`)
    }
    if (typeOpNode) { // compare typeops node properties exist in respose type of operation 
        // console.log("typeop node :", typeOpNode.getText());

        const isNonNullableIndexType = (node: ts.TypeNode): ts.IndexedAccessTypeNode | undefined => {
            let result: ts.IndexedAccessTypeNode | undefined = undefined
            const name = node.getText()
            console.log("name : ", name);
            if (name.startsWith("NonNullable<")) {
                const ta = (node as ts.TypeReferenceNode).typeArguments![0]
                if (ts.isIndexedAccessTypeNode(ta)) {
                    result = ta
                }
            }
            return result;
        }
        /**
         * 
         * @param input 
         * @param props 
         */
        const getObjectAccessAndIdentifier = (input: ts.TypeNode, props: string[] = []): { props: string[], node: ts.TypeReferenceNode } => {
            let ot: ts.TypeNode = input
            if (ts.isIndexedAccessTypeNode(input)) {
                ot = input.objectType
                props.unshift(input.indexType.getText().slice(1, -1))
            } else {
                const ib = isNonNullableIndexType(input)
                if (ib) {
                    props.unshift(ib.indexType.getText().slice(1, -1))
                    ot = ib.objectType
                }
            }
            if (ts.isIndexedAccessTypeNode(ot) || isNonNullableIndexType(ot)) {
                return getObjectAccessAndIdentifier(ot, props)
            } else {
                return { props, node: ot as any }
            }
        }
        const typeOpNodeNext = typeOpNode!.getText()
        let propsAcess: Record<string, string> | undefined = undefined
        let opName = ""
        if (typeOpNodeNext.startsWith("PaginateAppend") || typeOpNodeNext.startsWith("PaginatePrepend")) {
            let opNode: ts.TypeReferenceNode = typeOpNode as any;
            const args = opNode.typeArguments

            if (args) {
                const indexedNode: ts.TypeNode = args[0] as any
                if (!AstUtils.isNodeArrayType(indexedNode)) {
                    throw new Error(`PaginateAppend/PaginatePrepend allowed for array types only , ${indexedNode.getText()} is not an array type`)
                }
                console.log("Kind : ", indexedNode.kind);
                if (ts.isIndexedAccessTypeNode(indexedNode) || isNonNullableIndexType(indexedNode)) {
                    let { props, node } = getObjectAccessAndIdentifier(indexedNode)
                    console.log(" Paginated : props:", props, node.getText());
                    if (!transformFunctionQueryNode || props[0] === "data") { // if parent is data then we exclude data field 
                        props = props.slice(1)
                    }
                    //TODO  compare response type to indexed type isAssignable and better way to 
                    if (props.length > 0) {
                        propsAcess = { [group]: props.join(".") }
                    }
                } else {
                    throw new Error(`Paginated type arg should be an indexed type Obje["field1"] or NonNullable<Obj>["field1"]  ,${indexedNode.getText()} `)
                }

            } else {
                if (!ts.isArrayTypeNode(responseTypeNode)) {
                    throw new Error(`PaginateAppend/PaginatePrepend allowed for array types only`)
                }
                let respType = AstUtils.getTypeChecker().getTypeFromTypeNode(responseTypeNode)
                let idExists = false
                respType.getNonNullableType().getNumberIndexType()!.getProperties().some(p => {
                    if (p.escapedName === "id" || p.escapedName === "_id") {
                        idExists = true
                        return true
                    }
                })
                if (!idExists) {
                    throw new Error(`Type Ops only suuported on entities with id or _id field, ${responseTypeNode.getText()} doesn't contain id/_id field `)
                }
                opName = opNode.getText()
            }

        } else {
            if (transformFunctionQueryNode) {
                let symb = AstUtils.getTypeChecker().getSymbolAtLocation(transformFunctionQueryNode.exprName)
                if (!symb) {
                    throw new Error("no function definition for transform function node")
                }
                let decl = symb.declarations[0]
                if (ts.isImportSpecifier(decl) || ts.isImportClause(decl)) { // when import get aliased symbol
                    symb = AstUtils.getTypeChecker().getAliasedSymbol(symb)!
                    decl = symb.declarations[0]
                }
                console.log("decl text : ", decl.getText());
                if (ts.isVariableDeclaration(decl)) {
                    if (decl.initializer && ts.isArrowFunction(decl.initializer)) {
                        if (!decl.initializer.type) {
                            throw new Error(`when you specify typeops like Append/Prepend/Update/Delete List you must annotate transform function with return type`)
                        }
                        responseTypeNode = decl.initializer!.type;
                    }
                } else if (ts.isFunctionLike(decl)) {
                    console.log("decl");
                    if (!decl.type) {
                        throw new Error(`when you specify typeops like Append/Prepend/Update/Delete List you must annotate transform function with return type`)
                    }
                    responseTypeNode = decl.type
                } else {
                    throw new Error(`transform function must be a string, ${decl.getText()} `)
                }
            }
            const targetTypeNode = (typeOpNode as ts.TypeReferenceNode).typeArguments![0]
            let respType = AstUtils.getTypeChecker().getTypeFromTypeNode(responseTypeNode)
            respType = respType.getNonNullableType()

            let opNodeType = AstUtils.getTypeChecker().getTypeFromTypeNode(targetTypeNode)

            opNodeType = opNodeType.getNonNullableType()

            const indexType = opNodeType.getNumberIndexType()

            if (!indexType) {
                throw new Error("Target opnode should be an array type")
            }

            if (typeOpNodeNext.startsWith("DeleteFromList<") || typeOpNodeNext.startsWith("DeleteFromListAndDiscard")) { // if delete we just need to check for id in target response not all fields 
                if (respType.getProperties().filter(p => p.escapedName === "id" || p.escapedName === "_id").length === 0) {
                    throw new Error(`Delete Response must contain id/_id field`)
                }
            }
            else if (!AstUtils.isAssignableTo(respType, indexType)) {
                throw new Error(`${responseTypeNode.getText()} is not assignable to ${targetTypeNode.getText()}`)
            }
            const { node: cnode, props } = getObjectAccessAndIdentifier(targetTypeNode as any)
            console.log("pa ", props, cnode.getSourceFile().fileName);
            let csymb = AstUtils.getTypeChecker().getSymbolAtLocation(cnode.typeName)
            if (csymb) {
                let cdecl = csymb.declarations[0]
                console.log("decl :", csymb.declarations[0].getSourceFile().fileName, cdecl.kind);
                if (ts.isImportClause(cdecl) || ts.isImportSpecifier(cdecl)) {
                    csymb = AstUtils.getTypeChecker().getAliasedSymbol(csymb)
                    cdecl = csymb!.declarations[0]
                }
                const path = cdecl.getSourceFile().fileName;
                if (!ConfigUtils.isReducersSourceFile(path)) {
                    throw new Error(`TypeOps target field should be from reudcer classes only`)
                }
                const group = `${ConfigUtils.getPrefixPathForReducerGroup(path)}${cnode.getText()}`
                propsAcess = { [group]: props.join(".") }
            }
        }

        if (!opName.length) {
            const t = typeOpNode!.getText()
            const i = t.indexOf("<")
            opName = t.substr(0, i)
        }
        typeOpsResult = `{ name:"${opName}", ${propsAcess ? `obj:${JSON.stringify(propsAcess)}` : ""} }`

    }
    if (transformFunctionQueryNode && offload && !isGrpc) {// try to get response type of this function
        let symb = AstUtils.getTypeChecker().getSymbolAtLocation(transformFunctionQueryNode.exprName)
        let decl = symb!.declarations[0]
        let fd: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction = null as any
        if (ts.isImportSpecifier(decl) || ts.isImportClause(decl)) {
            symb = AstUtils.getTypeChecker().getAliasedSymbol(symb!)
            decl = symb.declarations[0]
        }
        if (ts.isVariableDeclaration(decl)) {
            const int = decl.initializer!
            if (ts.isArrowFunction(int)) {
                fd = int
            }
        } else if (ts.isFunctionDeclaration(decl)) {
            fd = decl
        } else if (ts.isMethodDeclaration(decl)) {
            fd = decl
        } else {
            throw new Error(`transform function should be arrow function/ function declaration / static method declaration`)
        }
        const paramName = fd.parameters[0].name.getText()
        let freqParam: string | undefined = undefined
        if (fd.parameters[1]) { // it takes fetch request
            freqParam = fd.parameters[1].name.getText()
        }
        let body = ""
        if (ts.isBlock(fd.body!)) {
            body = fd.body.getText()
        } else {
            body = `return ${fd.body?.getText()}`
        }
        const code = `
          function ${WorkersUtils.createFunctionNameFromGroup(name, group)}_fetch_transform(${paramName}:any${freqParam ? `,${freqParam}: any` : ""}) {
              ${body}
          }
        `
        WorkersUtils.addWorkerFunction({ name, group, code })
    }
    if (isGrpc && offload) {
        throw new Error(`GRPC offload is not supported atm, please file an issue if you really need that feature`)
        // const serializersDeclSymb = AstUtils.getTypeChecker().getSymbolAtLocation(grpcSerializeFnNode!.exprName)
        // if (!serializersDeclSymb) {
        //     throw new Error(`No symbol found for ${grpcDeserializeFnNode?.getText()}`)
        // }
        // const serliazerDecl = serializersDeclSymb.declarations[0]
        // if (ts.isMethodDeclaration(serliazerDecl)) {
        //     const params = serliazerDecl.parameters.map(p => `${p.name}: ${p.type?.getText()}`).join(", ")
        //     const code = `
        //        function ${WorkersUtils.createFunctionNameFromGroup(name, group)}_grpc_serializer(${params}) {
        //            ${serliazerDecl.body?.getText()}
        //        }
        //      `
        //     WorkersUtils.addWorkerFunction({ name, group, code })
        // } else {
        //     throw new Error(`please use classes and static methods to define serializers deserializers`)
        // }

        // const deserializersDeclSymb = AstUtils.getTypeChecker().getSymbolAtLocation(grpcDeserializeFnNode!.exprName)
        // if (!deserializersDeclSymb) {
        //     throw new Error(`No symbol found for ${grpcDeserializeFnNode?.getText()}`)
        // }
        // const deserliazerDecl = deserializersDeclSymb.declarations[0]
        // if (ts.isMethodDeclaration(deserliazerDecl)) {
        //     const params = deserliazerDecl.parameters.map(p => `${p.name}: ${p.type?.getText()}`).join(", ")
        //     const code = `
        //        function ${WorkersUtils.createFunctionNameFromGroup(name, group)}_grpc_deserializer(${params}) {
        //            ${deserliazerDecl.body?.getText()}
        //        }
        //      `
        //     WorkersUtils.addWorkerFunction({ name, group, code })
        // } else {
        //     throw new Error(`please use classes and static methods to define serializers deserializers`)
        // }

        // grpcMeta = `{ sf: ${grpcSerializeFnNode!.exprName.getText()}, dsf: ${grpcDeserializeFnNode!.exprName.getText()} }` as any
    }
    if (lpd.pd.name.getText() === "books2") {
        throw new Error("teseting : ")
    }

    return {
        name, actionPayload, bodyType, responseType: metaResponseType, grpcMeta, graphql, offload,
        tf: transformFunctionQueryNode?.exprName.getText(), typeOps: typeOpsResult
    }

}

export type ProcessPromisePropResult = { returnType: string }

const processPromiseProp = (lpd: LocalPropertyDecls): ProcessPromisePropResult => {
    const typeNode = lpd.pd.type
    let returnType = "any"
    if (!typeNode) {
        throw new Error(`for all TSPromise fields you should specify type name at declaration`)
    }
    if (ts.isTypeReferenceNode(typeNode) && typeNode.typeArguments?.length === 2) {
        returnType = typeNode.typeArguments[0].getText()
    } else {
        throw new Error(`All Promise fields should use TSPromise<R,E> type at field level`)
    }

    return { returnType }
}

/**
 *  All async actions of a class
 */
const getAsyncActionTypeAndMeta = (group: string): [string, { name: string, value: string }[]] => {
    const fetchProps: { name: string, value: string }[] = []
    const webSocketProps: { name: string, value: string }[] = []
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
            if (tpe.includes("_ts_pmeta") || tpe.startsWith("TSPromiseFieldValue")) {
                const ppR = processPromiseProp(p)
                promiseProps.push(name)
                result = `{name:"${name}",group:"${group}", promise: {promiseFn: (signal?: AbortSignal) => Promise<${ppR.returnType}>, _abortable?: boolean }`;
            } else if (tpe.includes("_fmeta") || tpe.includes("FetchAsyncData")) {
                const fr = processFetchProp2(p, group)
                const metas = `{response:"${fr.responseType}"${fr.offload ? `,offload: ${fr.offload}` : ""}${fr.tf ? `,tf: ${fr.tf}` : ""}${fr.graphql ? `,graphql:${fr.graphql}` : ""}${fr.typeOps ? `,typeOps: ${fr.typeOps}` : ""}${fr.grpcMeta ? `,grpc: ${fr.grpcMeta}` : ""}}`
                fetchProps.push({ name, value: `{f: ${metas} }` })
                result = `{name:"${
                    name
                    }",group:"${group}", fetch: ${fr.actionPayload}  }`;
            } else if (tpe.includes("_wsmeta") || tpe.includes("WebSocketFieldValue")) {
                const wr = processWebSocket(p, group)
                webSocketProps.push({ name, value: `{ws: ${wr.meta}}` })
                result = `{name:"${
                    name
                    }",group:"${group}", ws: ${wr.payload}  }`;
            }
            return result;
        }).join(" | ");

    const meta = [...fetchProps, ...webSocketProps,
    ...promiseProps.map(p => ({ name: p, value: `{p:{}}` }))]

    return [asyncType, meta]
};

type ActionType = { name: string, group: string, payload?: string }


const getPayloadForClassMethod = (m: ts.MethodDeclaration): string => {
    const n = m.name.getText();
    const params = m.parameters
    const pl = params.length;
    if (pl === 0) {
        return ""
    }
    let t = AstUtils.typeToString(
        memberTypes.find(mt => mt.name === n)!.type
    );
    let payload = ""
    if (m.typeParameters) {
        throw new Error(`typeParameters not supported on reducer methods , remove type parameters from ${m.name.getText()}`)
    }
    let offload = false
    if (m.type && m.type.getText() === "Offload") {
        offload = true
    }
    if (pl === 1) {
        payload = params[0].type!.getText() // dont uses toString value as it replaces all references to its values and we cant import all individual types
        if (offload) {
            payload = `{${params[0].name}: ${payload},_abortable?: boolean}`
        }
        // if (m.typeParameters) {
        //     const tp = m.typeParameters[0]
        //     const name = tp.name.getText()
        //     const r = new RegExp(name, "g") //TODO dont replace blidnly we have to iterate over type or just dont support type contraints https://stackoverflow.com/questions/61110391/how-to-replace-typeparaameter-from-typenode-using-typescript-compiler
        //     payload = payload.replace(r, tp.constraint!.getText())
        // }
    } else {
        // const typeParams = m.typeParameters ?
        //     m.typeParameters.map(tp => ({ name: tp.name.getText(), constraint: tp.constraint!, })) : []//Note: User should provide contrain based typeparams
        const paramsProcessed = params.map(p => {
            const name = p.name.getText()
            const isOptional = !!p.questionToken
            let t = p.type!.getText() // dont uses toString value as it replaces all references to its values and we cant import all individual types
            // if (typeParams.length > 0) {
            //     typeParams.forEach(tp => {
            //         if (tp.name === t) {
            //             t = tp.constraint.getText()
            //         }
            //     })
            // }
            return `${name}${isOptional ? "?" : ""}: ${t}`
        })
        if (offload) {
            paramsProcessed.push(`_abortable ?: boolean`)
        }
        payload = `{${paramsProcessed.join(", ")}}`
    }
    return payload;
}

export function getTypeForPropertyAccess(
    input: string[],
    mTypes: { name: string; type: ts.Type }[] = memberTypes
): ts.Type {
    console.log("**getTypeForPropertyAccess : ", "input: ", input, mTypes.length);
    let t = mTypes.find(mt => mt.name === input[0])!.type;

    console.log("Type : ", AstUtils.typeToString(t));
    if (input.length === 1) {
        return t;
    } else {
        const nt = t.getNonNullableType()
        if (AstUtils.isArrayType(nt)) {
            // console.log("**** ok its array type : ", input[0]);
            if (AstUtils.isTypeReference(nt)) {
                // console.log("its reference type");
                t = nt.typeArguments![0];
            } else {
                t = (nt as any).elementType;
                // console.log("its regular array type :", t);
            }
        } else {
            const props = t.getProperties()
            if (props.length === 0) { // Record<string,any>
                t = t.getStringIndexType()!
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
    const tpe = input.typeStr
    console.log("isAsyncPropDeclaration", tpe);
    return tpe.includes("_fmeta")
        || tpe.includes("FetchFieldValue")
        || tpe.includes("WebSocketFieldValue") || tpe.includes("_wsmeta") || tpe.includes("_ts_pmeta")
        || tpe.startsWith("TSPromiseFieldValue<")
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

export function isArrayMutatableAction(s: ts.Identifier | ts.PrivateIdentifier) {
    const name = s.getText();
    return arrayMutableMethods.includes(name);
}



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

function processThisStatement(exp: ts.Node, options: ProcessStatementsOptions = {}): ProcessThisResult {
    console.log("process thisResult  input: ", exp.getText())
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
            if (v.meta.access && v.meta.access.length > 1) { // this.ob[1][2]
                throw new Error(`Multiple element access is not supported`)
            }
        })
    }
    const result: ProcessThisResult = { group: group, value: values[0].name, values }
    console.log("Process this result : ", result);
    return result;
}

function processThisStatementOffload(exp: ts.Node, options: ProcessStatementsOptions = {}): ProcessThisResult {
    console.log("process thisResult offload input: ", exp.getText())
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
    let finalValues: MetaValue[] = []
    if (!onlyThisInput) {
        values.reverse().some(v => {
            const type = getTypeForPropertyAccess(v.name.split("."))
            const nonNullType = AstUtils.getNonNullableType(type)
            const tpeStr = AstUtils.typeToString(nonNullType).trim()
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
            console.log("tpeStr : ", tpeStr);
            let metaType = MetaType.UNKNOWN
            if (tpeStr === "string") {
                metaType = MetaType.STRING
            } else if (tpeStr === "number") {
                metaType = MetaType.NUMBER
            } else if (AstUtils.isArrayType(nonNullType)) {
                metaType = MetaType.ARRAY
            } else if (isObjectType(nonNullType)) {
                metaType = MetaType.OBJECT
            }
            v.meta.type = metaType
            finalValues.push(v)
            console.log("vm", metaType);
            if (metaType === MetaType.STRING || metaType === MetaType.ARRAY || v.meta.access) {
                return true;
            }
        })
    }
    const result: ProcessThisResult = { group: group, value: CommonUtils.lastElementOfArray(finalValues).name, values: finalValues }
    console.log("Process this result offload : ", result);
    return result;
}

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


