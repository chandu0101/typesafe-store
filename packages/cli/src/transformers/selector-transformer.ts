import * as ts from "typescript"
import { AstUtils } from "../utils/ast-utils";
import { CommonUtils } from "../utils/common-utils";
import { ConfigUtils } from "../utils/config-utils";
import { FileUtils } from "../utils/file-utils";
import chalk = require("chalk");
import { performance } from "perf_hooks"
import { collectVariableUsage, UsageDomain, VariableInfo } from "tsutils"

let currentProcessingFile: string = ""
let selectorAlreadyImported: boolean = false

/**
 *  files and their variable usage 
 */
const variableUsageMap = new Map<ts.SourceFile, Map<ts.Identifier, VariableInfo>>()

const cleanUpGloabls = () => {
    currentProcessingFile = ""
    selectorAlreadyImported = false
    variableUsageMap.clear()
}

const getVariableUsageOfNode = (node: ts.Node) => {
    const sf = node.getSourceFile()
    let vu = variableUsageMap.get(sf)
    if (!vu) {
        const vu2 = collectVariableUsage(sf)
        variableUsageMap.set(sf, vu2)
        vu = vu2
    }
    return vu
}


const isSelectorVariableDeclarationStatement = (node: ts.Node) => {
    let result = false
    if (ts.isVariableStatement(node)) {
        const decl = node.declarationList.declarations[0]
        if (decl.initializer && ts.isCallExpression(decl.initializer)) {
            const exp = decl.initializer.expression
            if (ts.isIdentifier(exp)) {
                const isSeelctorCall = exp.getText() === "createSelector"
                if (isSeelctorCall) {
                    const arg = (decl.initializer as ts.CallExpression).arguments[0]
                    result = ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)
                }
            }

        }
    }
    return result;
}

const isSelectorEVariableDeclarationStatement = (node: ts.Node) => {
    let result = false
    if (ts.isVariableStatement(node)) {
        const decl = node.declarationList.declarations[0]
        if (decl.initializer && ts.isCallExpression(decl.initializer)) {
            const exp = decl.initializer.expression
            if (ts.isIdentifier(exp)) {
                const isSeelctorCall = exp.getText() === "createSelectorE"
                if (isSeelctorCall) {
                    const arg = (decl.initializer as ts.CallExpression).arguments[0]
                    result = ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)
                }
            }

        }
    }
    return result;
}

type DependenciesOfObject = { parent: string, values: { value: string, childDeps?: DependenciesOfObject }[] }

/**
 *  state.x ( if x is array/string we don't need its further access)
 * @param node 
 */
const isNodeFurtherTracable = (node: ts.Node) => {
    let result = true

    if (AstUtils.isNodeArrayType(node)) {
        return false
    }
    const t = AstUtils.getTypeStrOfNode(node)
    if (t === "string") {
        result = false
    }

    return result
}

const isObjectkeysValuesCallExpression = (node: ts.CallExpression) => {
    let result = false
    const exp = node.expression
    if (ts.isPropertyAccessExpression(exp)) {
        const name = exp.name.getText()
        if (name === "keys" || name === "values" || name === "entires") {
            const o = exp.expression.getText()
            if (o === "Object") {
                result = true
            }
        }
    }

    return result;
}

/**
 *  
 * @param pa 
 */
const getPropertyAccessvalueAndItsParent = (pa: ts.Identifier): { value: string, pn?: ts.Node } => {
    const va: string[] = [pa.getText()]
    let pn: ts.Node | undefined = undefined
    let tempNode: ts.Node = null as any
    const innerFn = (node: ts.Node): any => {
        console.log("******* getPropertyAccessvalueAndItsParent", node.getText());
        if (ts.isPropertyAccessExpression(node)) {
            va.push(node.name.getText())
            tempNode = node
            return innerFn(node.parent)
        } else if (ts.isNonNullExpression(node)) {
            return innerFn(node.parent)
        } else if (ts.isElementAccessExpression(node)) { // if element access expression probably identifier we can not process further
            return
        }
        else if (ts.isVariableDeclaration(node)) {
            if (isNodeFurtherTracable(node)) {
                pn = node
            }
            return
        } else if (ts.isCallExpression(node)) {
            const isObjetCall = isObjectkeysValuesCallExpression(node)
            if (!isObjetCall && isNodeFurtherTracable(tempNode)) {
                pn = node
            }
            return
        } else {
            return
        }
    }
    innerFn(pa.parent)
    return { value: va.slice(1).join("."), pn }
}

const getDepencyObjectForCallExpression = (ce: ts.CallExpression, parent: string): DependenciesOfObject => {
    const symb = AstUtils.getTypeChecker().getSymbolAtLocation(ce.expression)!
    let decl = symb.declarations[0]
    if (ts.isImportSpecifier(decl) || ts.isImportClause(decl)) {
        const aSymbol = AstUtils.getTypeChecker().getAliasedSymbol(symb)
        decl = aSymbol.declarations[0]
    }
    let identiFier: ts.BindingName = null as any
    if (ts.isVariableDeclaration(decl)) {
        if (decl.initializer && ts.isArrowFunction(decl.initializer)) {
            identiFier = decl.initializer.parameters[0].name
        }
    } else if (ts.isFunctionDeclaration(decl) || ts.isMethodDeclaration(decl)) {
        identiFier = decl.parameters[0].name
    }
    if (identiFier === null) {
        throw new Error(`call Expression ${ce.getText()} is not supported yet`)
    }
    const variableUsage = getVariableUsageOfNode(decl)
    return getDependenciesOfObject(identiFier, { variableUsage, parentObj: parent })
}


const getDepenciesOfIdentifier = (id: ts.Identifier, variableUsage: Map<ts.Identifier, VariableInfo>) => {
    let result: { value: string, childDeps?: DependenciesOfObject }[] = []
    const usage = variableUsage.get(id)
    if (usage) {
        const valueuses = usage.uses.filter(vu => vu.domain === UsageDomain.ValueOrNamespace)
        valueuses.forEach(vu => {
            const loc = vu.location
            console.log("***** getDepenciesOfIdentifier ", loc.getText(), loc.parent.getText());
            if (ts.isPropertyAccessExpression(loc.parent)) {
                const { value: lv, pn } = getPropertyAccessvalueAndItsParent(loc)
                if (pn) {
                    if (ts.isVariableDeclaration(pn)) {
                        result.push({ value: lv, childDeps: getDependenciesOfObject(pn.name, { parentObj: lv, variableUsage }) })
                    } else if (ts.isCallExpression(pn)) {
                        result.push({ value: lv, childDeps: getDepencyObjectForCallExpression(pn, lv) })
                    }
                } else {
                    result.push({ value: lv })
                }
            } else if (ts.isCallExpression(loc.parent)) {
                const dofb = getDepencyObjectForCallExpression(loc.parent, "")
                result.push(...dofb.values)
            }
        })
    }

    return result;
}

const getDependenciesOfObjectBindingpattern = (obp: ts.ObjectBindingPattern, options: GetDependenciesOfObjectOptions) => {
    let result: { value: string, childDeps?: DependenciesOfObject }[] = []
    obp.elements.forEach(e => {
        const v = e.propertyName ? e.propertyName.getText() : e.name.getText()
        result.push({ value: v, childDeps: getDependenciesOfObject(e.name, { ...options, parentObj: v }) })
    })
    return result
}


type GetDependenciesOfObjectOptions = { parentObj?: string, variableUsage: Map<ts.Identifier, VariableInfo> }

/**
 * //TODO   reuse of selectors (its a must feature)
 *   
 * @param node 
 * @param obj 
 */
const getDependenciesOfObject = (node: ts.BindingName, options: GetDependenciesOfObjectOptions): DependenciesOfObject => {
    const result: DependenciesOfObject = { values: [], parent: options.parentObj ? options.parentObj : "state" }
    if (ts.isIdentifier(node)) {
        result.values = getDepenciesOfIdentifier(node, options.variableUsage)
    } else if (ts.isObjectBindingPattern(node)) {
        result.values = getDependenciesOfObjectBindingpattern(node, options)
    }
    return result;
}

const processChildDependecy = (cdo?: DependenciesOfObject): string => {
    if (!cdo) return ""
    return cdo.values.map(v => `${v.value}.${processChildDependecy(v.childDeps)}`).join(".")
}

const processDependencyObject = (dg: DependenciesOfObject) => {
    const result: Map<string, Set<string>> = new Map()

    dg.values.forEach(dgv => {
        const a = dgv.value.split(".")
        const k = a[0]
        let value = a.slice(1).join(".")
        if (dgv.childDeps) {
            let cv = processChildDependecy(dgv.childDeps)
            if (cv.length) {
                if (cv.endsWith(".")) {
                    cv = cv.substr(0, cv.length - 1)
                }
                value = value === "" ? cv : `${value}.${cv}`
            }
        }
        const mv = result.get(k)
        if (mv) {
            if (value.length) {
                mv.add(value)
            }
        } else {
            const s = new Set<string>()
            if (value.length) {
                s.add(value)
            }
            result.set(k, s)
        }
    })

    const resultObj: Record<string, string[]> = {}

    for (const [key, value] of result) {
        resultObj[key] = [...value]
    }

    return resultObj

}


const getReturnTypeOfFunction = (f: ts.ArrowFunction | ts.FunctionExpression) => {
    const t = AstUtils.getTypeStrOfNode(f)
    const ai = t.lastIndexOf("=>")
    return t.substr(ai + 2).trim()
}


const getSelectorFromFunction = (f: ts.ArrowFunction | ts.FunctionExpression, name: string, ext: boolean) => {
    if (!f.type) {
        throw new Error(`For selectors you must specify return type`)
    }
    if (ext && f.parameters.length < 2) {
        throw new Error("createSelectorE should be a function state and external input ")
    }
    const stateParam = f.parameters[0]
    const variableUsage = getVariableUsageOfNode(f)
    const dg = getDependenciesOfObject(stateParam.name, { variableUsage })
    console.log("Dependency graph : ", JSON.stringify(dg));
    const pg = processDependencyObject(dg)
    console.log("Final Dependency Result : ", pg);
    const sType = stateParam.type!.getText()
    const rType = f.type!.getText()
    let result = `export const ${name}:Selector<${sType},${rType}> = {fn:${f.getText()},dependencies:${JSON.stringify(pg)}}`
    if (ext) {
        const extInputType = f.parameters[1].type!.getText()
        result = `export const ${name}:SelectorE<${sType},${extInputType},${rType}> = {fne:${f.getText()},dependencies:${JSON.stringify(pg)}}`
    }
    return result
}

const createSelctorSelectorNode = (node: ts.VariableStatement, ext: boolean) => {
    const decl = node.declarationList.declarations[0]
    const name = decl.name.getText()
    const ce = decl.initializer! as ts.CallExpression
    const arg = ce.arguments[0]
    let result = ""
    if (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) {
        result = getSelectorFromFunction(arg, name, ext)
    } else {
        throw new Error(`You should specify array function or normal function for createSelector`)
    }
    return ts.createIdentifier(result)
}

const isSeelctorAlreadyImported = (id: ts.ImportDeclaration) => {
    if (selectorAlreadyImported) return
    let result = false
    const ms = id.moduleSpecifier.getText()
    if (ms === "@typesafe-store/store") {
        if (id.importClause && id.importClause.namedBindings) {
            const nBindings = id.importClause.namedBindings!
            if (ts.isNamedImports(nBindings)) {
                result = Boolean(nBindings.elements.find(nb => nb.getText() === "Selector"))
            }
        }
    }
    selectorAlreadyImported = result
}



const selectorTransformer: ts.TransformerFactory<ts.SourceFile> = context => {
    const visit: ts.Visitor = node => {
        node = ts.visitEachChild(node, visit, context);
        if (isSelectorVariableDeclarationStatement(node)) {
            console.log("seelctor found and processing");
            return createSelctorSelectorNode(node as any, false);
        }
        if (isSelectorEVariableDeclarationStatement(node)) {
            console.log("seelctor found and processing");
            return createSelctorSelectorNode(node as any, true);
        }
        if (ts.isImportDeclaration(node)) {
            isSeelctorAlreadyImported(node)
            return AstUtils.transformImportNodeToGeneratedFolderImportNodes(node)
        }
        return node;
    };

    return node => ts.visitNode(node, visit);
};

const transformFile = (file: string) => {

    try {
        console.log("transforming file : ", file);
        const t0 = performance.now();
        currentProcessingFile = file
        const sf = AstUtils.getSourceFile(file)!;
        const printer = ts.createPrinter();
        const newSf = ts.transform(sf, [selectorTransformer]).transformed[0];
        const transformedContent = printer.printFile(newSf)
        let imports: string[] = []
        if (!selectorAlreadyImported) {
            imports.push(`import {Selector,SelectorE} from "@typesafe-store/store"`)
        }
        const output = `
           ${CommonUtils.dontModifyMessage()}
           ${imports.join("\n")}
           ${transformedContent}
          `;
        const outFile = ConfigUtils.getOutputPathForSelectorSourceFile(file)
        console.log("******* writing to out file : ", outFile);
        console.log("outFile : ", outFile);
        FileUtils.writeFileSync(outFile, output);
        const t1 = performance.now();
        console.log("time : ", t1 - t0, " ms");
        cleanUpGloabls()
    } catch (error) {
        console.log(chalk.red(`Error Processing file ${file} : ${error}`))
    }

}

export function transformSelectorFiles(files: string[]) {

    files.forEach(f => {
        transformFile(f)
    })
}
