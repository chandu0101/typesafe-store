import * as ts from "typescript";
import {
    LocalPropertyDecls, EAccess, MetaValue, Meta, ReducersMeta, AsyncTypes, TypeSafeStoreConfig, TypeSafeStoreConfigExtra, HttpUrlConfig,
    MetaType, NewValue, GS, ProcessThisResult
} from "../types";
import {
    T_STORE_ASYNC_TYPE, REDUCERS_FOLDER, GENERATED_FOLDER,
    TSTORE_TEMP_V, EMPTY_REDUCER_TRANFORM_MESSAGE, GEN_SUFFIX
} from "../constants";
import { resolve, join, dirname, sep } from "path";
import { ConfigUtils } from "../utils/config-utils";
import { AstUtils } from "../utils/ast-utils";
import { FileUtils } from "../utils/file-utils";
import { CommonUtils } from "../utils/common-utils";

let wcp: ts.WatchOfConfigFile<ts.SemanticDiagnosticsBuilderProgram> = null as any;

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

function transformFile(file: string) {
    console.log("transforming file : ", file);
    const t0 = performance.now();
    setCurrentProcessingReducerFile(file)
    const sf = AstUtils.getSourceFile(file)!;
    const printer = ts.createPrinter();
    const newSf = ts.transform(sf, [reducerTransformer]).transformed[0];
    const transformedContent = printer.printFile(newSf)
    let imports = ""
    if (!transformedContent.includes(EMPTY_REDUCER_TRANFORM_MESSAGE)) {
        imports = `import { ReducerGroup,FetchVariants } from "@typesafe-store/reducer"`
    }
    const output = `
       ${CommonUtils.dontModifyMessage()}
       ${imports}
       ${printer.printFile(newSf)}
      `;
    const outFile = getOutputPathForReducerSourceFile(file)
    console.log("******* writing to out file : ", outFile);
    console.log("outFile : ", outFile);
    FileUtils.writeFileSync(outFile, output);
    const t1 = performance.now();
    console.log("time : ", t1 - t0, " ms");
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
        return node;
    };

    return node => ts.visitNode(node, visit);
};



//constants

export const createReducerFunction = (cd: ts.ClassDeclaration) => {
    setClassDeclaration(cd);
    const propDecls = getPropDeclsFromTypeMembers();
    const defaultState = getDefaultState(propDecls);
    const typeName = getTypeName();
    const caseClauses = getSwitchClauses();
    let [asyncActionType, asyncMeta] = getAsyncActionTypeAndMeta();
    let result = ts.createIdentifier("")
    if (caseClauses.length === 0 && asyncActionType === "") { // If no async properties and methods then return empty node
        result = ts.createIdentifier(EMPTY_REDUCER_TRANFORM_MESSAGE)
    } else {
        const f = buildFunction({ caseClauses: caseClauses, group: typeName });
        let actionType = getActionType()
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
  
           export const ${typeName}ReducerGroup: ReducerGroup<${typeName}State,${typeName}Action,"${typeName}",${typeName}AsyncAction> = { r: ${f},g:"${typeName}",ds:${defaultState},m:${meta}}
  
          `
        );
    }

    cleanUpGloabals();
    return result;
};


const getSwitchClauses = () => {

    const methods = getMethodsFromTypeMembers();

    return methods
        .filter(m => m.body && m.body.statements.length > 0)
        .map(m => {
            const name = m.name.getText();
            const reservedStatements: string[] = [];
            const generalStatements: GS[] = [];
            const parentGroups: Map<
                string,
                Map<string, [ProcessThisResult["values"], NewValue]>
            > = new Map();
            const PREFIX = "_tr_";
            const propertyAssigments: string[] = [];
            let duplicateExists = false;
            let otherThanMutationStatements = false;

            const addOrUpdateParentGroup = (
                { g, v, values }: ProcessThisResult,
                newValue: NewValue
            ) => {
                const oldValue = parentGroups.get(g);
                if (!oldValue) {
                    const map = new Map();
                    parentGroups.set(g, map.set(v, [values, newValue]));
                } else {
                    if (oldValue.get(v)) {
                        duplicateExists = true;
                    }
                    parentGroups.set(g, oldValue.set(v, [values, newValue]));
                }
            };
            const paramsLenth = m.parameters.length;

            if (paramsLenth > 0) {
                let v = "";
                if (paramsLenth === 1) {
                    v = `const ${m.parameters[0].name.getText()} = (action as any).payload`;
                } else {
                    v = `const { ${m.parameters
                        .map(p => p.name.getText())
                        .join(",")} } = (action as any).payload`;
                }
                reservedStatements.push(v);
            }

            const statements = m.body!.statements;

            // const processStatements = ()

            statements.forEach(s => {
                const text = s.getText().trim();
                if (ts.isExpressionStatement(s) && text.startsWith("this.")) {
                    if (ts.isPostfixUnaryExpression(s.expression)) {
                        let op = "";
                        const operand = s.expression.operand;
                        const result = processThisStatement(operand as any);
                        const exprLeft = operand.getText();
                        const exprRight = "1";
                        let modifiedField = lastElementOfArray(exprLeft.split("."));
                        let newValue = { name: modifiedField, op: "=", value: "" };
                        const x = exprLeft.replace("this.", "state.");
                        if (s.expression.operator === ts.SyntaxKind.PlusPlusToken) {
                            op = "+=";
                            newValue.value = `${x} + 1`;
                        } else {
                            op = "-=";
                            newValue.value = `${x} - 1`;
                        }
                        addOrUpdateParentGroup(result, newValue);
                        generalStatements.push(
                            `${exprLeft.replace("this.", PREFIX)} ${op} ${exprRight}`
                        );
                    }
                    if (ts.isBinaryExpression(s.expression)) {
                        const left = s.expression.left;
                        const result = processThisStatement(left as any);
                        const exprLeft = left.getText();
                        let exprRight = s.expression.right.getText();
                        const op = s.expression.operatorToken.getText();
                        let modifiedField = lastElementOfArray(exprLeft.split("."));
                        let newValue = { name: modifiedField, op: op, value: exprRight };

                        if (s.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                            newValue.value = exprRight;
                        } else {
                            newValue.value = `${exprLeft.replace(
                                "this.",
                                ""
                            )} ${op} ${exprRight}`;
                        }
                        addOrUpdateParentGroup(result, newValue);
                        generalStatements.push(
                            `${exprLeft.replace("this.", PREFIX)} ${op} ${exprRight}`
                        );
                    }

                    if (
                        ts.isCallExpression(s.expression) &&
                        ts.isPropertyAccessExpression(s.expression.expression) &&
                        isArrayMutatableAction(s.expression.expression.name)
                    ) {
                        const exp = s.expression.expression;
                        const result = processThisStatement(exp.expression as any, true);
                        let args = s.expression.arguments.map(a => a.getText()).join(",");
                        let modifiedField = lastElementOfArray(
                            exp.expression.getText().split(".")
                        );
                        let newValue = {
                            name: modifiedField,
                            op: s.expression.expression.name.getText(),
                            value: ""
                        };
                        newValue.value = args;
                        addOrUpdateParentGroup(result, newValue);
                        generalStatements.push(s.getText().replace("this.", PREFIX));
                    }
                } else if (ts.isExpressionStatement(s) && ts.isDeleteExpression(s.expression)) {
                    throw new Error("delete expression not supported,  instead assign value to property")
                }
                else {
                    otherThanMutationStatements = true;
                    // other than straight mutations handle forEach/if else/tenary operator
                    if (
                        ts.isExpressionStatement(s) &&
                        ts.isCallExpression(s.expression) &&
                        ts.isPropertyAccessExpression(s.expression.expression) &&
                        s.expression.expression.name.getText() === "forEach"
                    ) {
                        // forEach
                    } else if (
                        ts.isExpressionStatement(s) &&
                        ts.isConditionalExpression(s.expression)
                    ) {
                        // terinary op
                    } else if (ts.isIfStatement(s) && !s.elseStatement) {
                        // only if
                    } else if (ts.isIfStatement(s) && s.elseStatement) {
                        // if and else
                    } else {
                        generalStatements.push(s.getText());
                    }
                }
            });

            if (!duplicateExists && !otherThanMutationStatements) {
                parentGroups.forEach((value, group) => {
                    propertyAssigments.push(
                        `${group}:${invalidateObjectWithList({ input: value })}`
                    );
                });
                return `case "${name}" : {
                    ${reservedStatements.join("\n")}
                    return { ...state, ${propertyAssigments.join(",")} }
                }`;
            }
            //
            parentGroups.forEach((value, group) => {
                console.log("parent Group Entries: ", group, "Values : ", value);
                const key = Array.from(value.keys())[0];
                if (value.size === 1 && !key.includes(".")) {
                    const a1 = value.get(key)![0][0];
                    console.log("Single param : ", a1.meta);
                    let s = "";
                    const sk = `${PREFIX}${group}`;
                    if (a1.meta.type === MetaType.ARRAY) {
                        s = `let ${sk} = [...state.${group}]`;
                    } else if (a1.meta.type === MetaType.OBJECT) {
                        s = `let ${sk} = {...state.${group}}`;
                    } else {
                        s = `let ${sk} = state.${group}`;
                    }
                    reservedStatements.push(s);
                } else {
                    reservedStatements.push(
                        `let ${PREFIX}${group} = ${invalidateObjectWithList({
                            input: value
                        })}`
                    );
                }
                propertyAssigments.push(`${group}:${PREFIX}${group}`);
            });

            return `case "${name}" : {
                ${reservedStatements.join("\n")}
                ${generalStatements.join("\n")}
                return { ...state, ${propertyAssigments.join(",")} }
            }`;
        });
};

const invalidateObjectWithList2 = ({
    input,
    traversed = [],
    parent = "state"
}: {
    input: Map<string, [ProcessThisResult["values"], NewValue]>;
    traversed?: string[];
    parent?: string;
}): string => {
    const entries = Array.from(input.entries());
    if (input.size === 1) {
        const [key, values] = entries[0];
        const v =
            traversed.length > 0 ? `${parent}.${traversed.join(".")}` : `${parent}`;
        return invalidateObject2({
            map: { input: key.split("."), values: values[0], newValue: values[1] },
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

const invalidateObject2 = ({
    map: { input, values, newValue },
    traversed = [],
    parent = "state"
}: {
    map: {
        input: string[];
        values: ProcessThisResult["values"];
        newValue: NewValue;
    };
    traversed?: string[];
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
    const vv1 = traversed.length > 0 ? `${traversed.join(".")}.${v1}` : `${v1}`;
    const v =
        traversed.length > 0
            ? `${parent}.${traversed.join(".")}.${v1}`
            : `${parent}.${v1}`;
    const v1t = values.find(v => v.name === vv1)!;
    // const v1t: ProcessThisResult["values"][0] = { name: "", meta: { isOptional: false, isArray: false } }
    if (input.length === 1) {
        if (v1t.meta.type === MetaType.ARRAY) {
            if (v1t.meta.access && v1t.meta.access.length > 1) {
                // multiple argument access
                console.log("****** numberAcess found2 ");
                return `[...${v}.map((v,index) => index === ${v1t.meta.access[0].name} ? {...v} : v)]`;
            } else if (v1t.meta.access) {
                // single argument access
            }
            return `[...${v}]`;
        } else {
            return `{...${v}}`;
        }
    } else {
        const v2 = input[1];
        const vv2 = `${vv1}.${v2}`;
        const v2t = values.find(v => v.name === vv2)!;
        const v2exapnd = invalidateObject2({
            map: { input: input.slice(1), values, newValue },
            traversed: traversed.concat([v1])
        });
        const expand =
            v1t.meta.type === MetaType.ARRAY
                ? `[...${v}.map((v,index) => index === ${v1t.meta.access?.[0].name} ? {...v,${v2}:${v2exapnd}} : v)]`
                : `{ ...${v},${v2}:${v2exapnd} }`;

        if (v2t.meta.isOptional) {
            return `${v} ? ${expand} : ${v}`;
        }
        return expand;
    }
};

const invalidateObjectWithList = ({
    input,
    traversed = [],
    parent = "state"
}: {
    input: Map<string, [ProcessThisResult["values"], NewValue]>;
    traversed?: string[];
    parent?: string;
}): string => {
    const entries = Array.from(input.entries());
    if (input.size === 1) {
        const [key, values] = entries[0];
        const v =
            traversed.length > 0 ? `${parent}.${traversed.join(".")}` : `${parent}`;
        return invalidateObject({
            map: { input: key.split("."), values: values[0], newValue: values[1] },
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
    parent = "state"
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
    // const v1t: ProcessThisResult["values"][0] = { name: "", meta: { isOptional: false, isArray: false } }
    if (input.length === 1) {
        if (traversed.length === 0 && v1t.meta.type === MetaType.UNKNOWN) {
            return newValue.value;
        } else {
            if (v1t.meta.type === MetaType.ARRAY) {
                let result = "";
                if (v1t.meta.access && v1t.meta.access.length > 1) {
                    // TODO multiple argument access
                    console.log("****** numberAcess found1 ", v1t.meta.isOptional);
                    const a = v1t.meta.access[0].name;
                    let obs = `{...${TSTORE_TEMP_V},${newValue.name}:${newValue.value}}`;
                    if (v1t.meta.isOptional) {
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
                    if (v1t.meta.isOptional) {
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
                    if (v1t.meta.isOptional) {
                        return `${v} ? ${result} : ${v}`;
                    }
                    return result;
                }
            } else {
                const r = `{...${v},${newValue.name}:${newValue.value}}`;
                if (v1t.meta.isOptional) {
                    console.log(`Optional found1 : ,v1 = ${v1}, v = ${v}`);
                    return `${v} ? ${r} : ${v}`;
                }
                return r;
            }
        }
    } else {
        const v2 = input[1];
        const v2t = values.find(v => v.name === vv1)!;
        let access = v1t.meta.access?.[0].name || undefined;
        if (v1t.meta.isOptional) {
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
            if (v1t.meta.isOptional) {
                obs = `${TSTORE_TEMP_V} ? ${obs} : ${TSTORE_TEMP_V}`;
            }
            expand = `[...${v}.map((${TSTORE_TEMP_V},_i) => _i === ${v1t.meta.access?.[0].name} ? ${obs} : ${TSTORE_TEMP_V})]`;
        } else {
            expand = `{ ...${v},${v2}:${v2exapnd} }`;
            if (v1t.meta.isOptional) {
                expand = `${v} ? ${expand} : ${v}`;
            }
        }
        if (v2t.meta.isOptional) {
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
    (state:${group}State,action:${group}Action) => {
       const t = action.name
       switch(t) {
         ${caseClauses.join("\n")}
       }
    }
  `;
    } else {
        return `
     (state:${group}State,action:${group}Action) => {
       return state;
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

export function setWatchCompilerHost(p: typeof wcp) {
    wcp = p;
}

export function setStorePath(path: string) {
    storePath = path
}

// export function getStoreTypesPath() {
//   return join(config.storePath, STORE_TYPES_FOLDER)
// }



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

export const getStateType = () => {
    return `{${propDecls
        .map(p => {
            const n = p.pd.name.getText();
            return `${n}:${p.typeStr}`;
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
    const gqlProps: string[] = []
    const asyncType = propDecls
        .filter(isAsyncPropDeclaration)
        .map(p => {
            let result = "undefined";
            const declaredType = p.pd.type!.getText();
            console.log(
                "Async TypeStr : ", p.typeStr,
            );
            const tpe = p.typeStr
            if (declaredType.startsWith(AsyncTypes.PROMISE)) {
                result = `{name:"${p.pd.name}",group:"${group}", promise: () => ${p.typeStr} }`;
            } else if (tpe.includes("_fmeta")) {
                const name = p.pd.name.getText()
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
    gql:${gqlProps.length > 0 ? `{${gqlProps.map(p => `${p}:{}`).join(",")}}` : "undefined"}
  `
    return [asyncType, meta]
};

export const getActionType = () => {
    const methods = getMethodsFromTypeMembers();
    const group = `${ConfigUtils.getPrefixPathForReducerGroup(currentProcessingReducerFile)}${getTypeName()}`;
    const generalMethods = methods.map(m => {
        const n = m.name.getText();
        const pl = m.parameters.length;
        if (pl === 0) {
            return `{name :"${n}",group:"${group}"}`;
        }
        const t = AstUtils.typeToString(
            memberTypes.find(mt => mt.name === n)!.type
        );
        const pt = t
            .split("=>")[0]
            .trim()
            .slice(1)
            .slice(0, -1);
        let p = "";
        if (pl === 1) {
            p = pt.slice(pt.indexOf(":") + 1).trim();
        } else {
            p = `{${pt}}`;
        }
        return `{name :"${n}",group:"${group}",payload:${p}}`;
    });

    // Asynchronus actions

    return generalMethods.join(" | ");
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

    if (input.length === 1) {
        return t;
    } else {
        if (AstUtils.isArrayType(t)) {
            // console.log("**** ok its array type : ", input[0]);
            if (AstUtils.isTypeReference(t)) {
                // console.log("its reference type");
                t = t.typeArguments![0];
            } else {
                t = (t as any).elementType;
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
    return input.typeStr.startsWith(T_STORE_ASYNC_TYPE);
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

export function replaceThisIdentifier(
    input: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    prefix?: string
):
    | ts.PropertyAccessExpression
    | ts.ElementAccessExpression
    | ts.NonNullExpression {
    if (ts.isPropertyAccessExpression(input)) {
        if (input.expression.kind === ts.SyntaxKind.ThisKeyword) {
            if (prefix)
                return ts.createIdentifier(
                    `${prefix}${getNameofPropertyName(input.name)}`
                ) as any;
            return ts.createPropertyAccess(ts.createIdentifier("state"), input.name);
        }
        return ts.createPropertyAccess(
            replaceThisIdentifier(input.expression as any, prefix),
            input.name
        );
    } else if (ts.isPropertyAccessChain(input)) {
        return ts.createPropertyAccessChain(
            replaceThisIdentifier(input.expression as any, prefix),
            input.questionDotToken,
            input.name
        );
    } else if (ts.isNonNullExpression(input)) {
        return ts.createNonNullExpression(
            replaceThisIdentifier(input.expression as any, prefix)
        );
    } else {
        if (ts.isElementAccessChain(input)) {
            return ts.createElementAccessChain(
                replaceThisIdentifier(input.expression as any, prefix),
                input.questionDotToken,
                input.argumentExpression
            );
        }
        return ts.createElementAccess(
            replaceThisIdentifier(input.expression as any, prefix),
            input.argumentExpression
        );
    }
}




function typeOfArray(input: string) {
    return input.charCodeAt(0);
}

function convertTypeTo() { }

function typeOfMultipleArray(input: EAccess[], name: string): EAccess[] {
    const t = getTypeForPropertyAccess(name.split(","));
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
export function processThisStatement(
    exp: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    arrayMut?: boolean
): ProcessThisResult {
    // console.log("processTHis Statemenut input : ", exp.getText(), "arrayArg", arrayMut);
    const values: MetaValue[] = [];
    let propIdentifier: Omit<Meta, "type"> = {};
    let argumentAccessOptional = false;
    const processInner = (
        input: ts.PropertyAccessExpression | ts.ElementAccessExpression = exp
    ): ProcessThisResult => {
        if (ts.isPropertyAccessExpression(input)) {
            const parent = getNameofPropertyName(input.name);
            if (input.expression.kind === ts.SyntaxKind.ThisKeyword) {
                let v = parent;
                let isObject = false;
                // console.log("Parent2 : ", v, "values: ", values);
                if (values.length > 0) {
                    isObject = true;
                    // console.log("before splice : ", arrayMut, values);
                    if (!arrayMut) values.splice(0, 1);
                    if (values.length > 0) {
                        values.forEach(v => {
                            v.name = `${parent}.${v.name}`;
                            if ((v.meta.access || arrayMut) && isArrayPropAccess(v.name)) {
                                v.meta.type = MetaType.ARRAY;
                            } else if (v.meta.access?.length && v.meta.access.length > 1) {
                                // multiple prop access
                                if (
                                    v.meta.access.filter(
                                        a => a.exp.kind === ts.SyntaxKind.Identifier
                                    ).length > 0
                                ) {
                                    throw new Error("dynamic identifier access not supported");
                                }
                                v.meta.access = typeOfMultipleArray(v.meta.access, v.name);
                            }
                        });
                        v = values[0].name;
                    }
                    // console.log("after  splice : ", arrayMut, values);
                }
                const isArray =
                    propIdentifier.access || arrayMut ? isArrayPropAccess(parent) : false;
                const t = isArray
                    ? MetaType.ARRAY
                    : isObject
                        ? MetaType.OBJECT
                        : MetaType.UNKNOWN;
                values.push({ name: parent, meta: { ...propIdentifier, type: t } });
                const result = { g: parent, v, values };
                console.log("processThisStatement Result :", result);
                return result;
            }
            // console.log("Processing parent2: ", parent);
            values.forEach(v => {
                v.name = `${parent}.${v.name}`;
            });
            values.push({
                name: parent,
                meta: { ...propIdentifier, type: MetaType.UNKNOWN }
            });
            propIdentifier = {};
            return processInner(input.expression as any);
        } else if (
            ts.isNonNullExpression(input) &&
            ts.isPropertyAccessExpression(input.expression)
        ) {
            const parent = getNameofPropertyName(input.expression.name);
            // console.log("Processing parent : ", parent);
            values.forEach(v => {
                v.name = `${parent}.${v.name}`;
            });
            values.push({
                name: parent,
                meta: { ...propIdentifier, type: MetaType.UNKNOWN, isOptional: true }
            });
            if (parent === "arr2") {
                console.log(
                    "*********** Arr2 : ",
                    propIdentifier,
                    values[values.length - 1]
                );
            }
            propIdentifier = {};

            return processInner(input.expression.expression as any);
        } else if (
            ts.isNonNullExpression(input) &&
            ts.isElementAccessExpression(input.expression)
        ) {
            console.log(
                "*****Argument Access Optional : ",
                argumentAccessOptional,
                input.getText()
            );
            argumentAccessOptional = true;
            return processInner(input.expression as any);
        } else if (
            ts.isElementAccessExpression(input) &&
            ((ts.isNonNullExpression(input.expression) &&
                ts.isPropertyAccessExpression(input.expression.expression)) ||
                ts.isPropertyAccessExpression(input.expression))
        ) {
            //TODO this.prop[_]
            propIdentifier = {};
            propIdentifier.access = [
                {
                    name: input.argumentExpression.getText(),
                    exp: input.argumentExpression,
                    type: MetaType.UNKNOWN
                }
            ];
            if (argumentAccessOptional) {
                propIdentifier.isOptional = true;
                argumentAccessOptional = false;
            }
            return processInner(input.expression as any);
        } else if (
            ts.isElementAccessExpression(input) &&
            (ts.isElementAccessExpression(input.expression) ||
                (ts.isNonNullExpression(input.expression) &&
                    ts.isElementAccessExpression(input.expression.expression)))
        ) {
            // multiple element access this.a[0][1]
            console.log(
                "********* Got multiple access ********",
                argumentAccessOptional,
                input.getText()
            );
            const { access, exp } = processMultipleElementAccess(input);
            propIdentifier = {};
            propIdentifier.access = access.map((a, index) => {
                return { ...a, type: MetaType.UNKNOWN };
            });

            console.log(
                "********** got multiple access *******",
                propIdentifier.access,
                propIdentifier.isOptional,
                exp.getText()
            );
            // if (ts.isNonNullExpression(exp)) {
            //   console.log("***** Optional found : ");
            //   propIdentifier.isOptional = true;
            //   return processInner(exp.expression as any);
            // }
            return processInner(exp as any);
        } else {
            throw new Error(`${exp.getText()} is not supported.`);
        }
    };
    return processInner(exp);
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

/**
 *   
 * @param file 
 */
export function getOutputPathForReducerSourceFile(file: string) {
    const reducers = `${sep}${REDUCERS_FOLDER}${sep}`
    const genReducers = `${reducers}${GENERATED_FOLDER}${sep}`
    return file.replace(reducers, genReducers).replace(".ts", `${GEN_SUFFIX}.ts`)
}

