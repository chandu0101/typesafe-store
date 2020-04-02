import * as ts from "typescript"
import { AstUtils } from "../utils/ast-utils";
import { CommonUtils } from "../utils/common-utils";
import { ConfigUtils } from "../utils/config-utils";
import { FileUtils } from "../utils/file-utils";
import chalk = require("chalk");
import { performance } from "perf_hooks"
import { collectVariableUsage, UsageDomain } from "tsutils"

let currentProcessingFile: string = ""
let selectorAlreadyImported: boolean = false
let variableUsage: ReturnType<typeof collectVariableUsage> = null as any


const cleanUpGloabls = () => {
    currentProcessingFile = ""
    selectorAlreadyImported = false
    variableUsage = null as any
}


const isSeelctorVariableDeclarationStatement = (node: ts.Node) => {
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


type DependenciesOfObject = { parent: string, values: { value: string, childDeps?: DependenciesOfObject }[] }



const getPropertyAccessvalueAndItsParent = (pa: ts.Identifier): { value: string, vd?: ts.VariableDeclaration } => {
    let result: { value: string, vd?: ts.VariableDeclaration } = { value: "" }
    const va: string[] = [pa.getText()]
    let vd: ts.VariableDeclaration | undefined = undefined
    const innerFn = (node: ts.Node): any => {
        if (ts.isPropertyAccessExpression(node)) {
            va.push(node.name.getText())
            return innerFn(node.parent)
        } else if (ts.isVariableDeclaration(node)) {
            const t = AstUtils.getTypeOfNode(node)
            console.log("Got type : ", t);
            if (t !== "string") { //check for others also 
                vd = node
            }
            return
        } else {
            return
        }
    }
    innerFn(pa.parent)
    result.value = va.slice(1).join(".")
    result.vd = vd
    return result
}

const getDepenciesOfIdentifier = (id: ts.Identifier) => {
    let result: { value: string, childDeps?: DependenciesOfObject }[] = []
    const usage = variableUsage.get(id)
    if (usage) {
        const valueuses = usage.uses.filter(vu => vu.domain === UsageDomain.ValueOrNamespace)
        valueuses.forEach(vu => {
            const loc = vu.location
            if (ts.isPropertyAccessExpression(loc.parent)) {
                const { value: lv, vd: lvd } = getPropertyAccessvalueAndItsParent(loc)
                if (lvd) {
                    result.push({ value: lv, childDeps: getDependenciesOfObject(lvd.name, lv) })
                } else {
                    result.push({ value: lv })
                }
            }
        })
    }

    return result;
}

const getDependenciesOfObjectBindingpattern = (obp: ts.ObjectBindingPattern, ) => {
    let result: { value: string, childDeps?: DependenciesOfObject }[] = []
    obp.elements.forEach(e => {
        const v = e.propertyName ? e.propertyName.getText() : e.name.getText()
        result.push({ value: v, childDeps: getDependenciesOfObject(e.name, v) })
    })
    return result
}


//TODO  understand compiler API alittle more 
const getDependenciesOfObject = (node: ts.BindingName, obj?: string): DependenciesOfObject => {
    const result: DependenciesOfObject = { values: [], parent: obj ? obj : "state" }
    if (ts.isIdentifier(node)) {
        result.values = getDepenciesOfIdentifier(node)
    } else if (ts.isObjectBindingPattern(node)) {
        result.values = getDependenciesOfObjectBindingpattern(node)
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
            mv.add(value)
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
    const t = AstUtils.getTypeOfNode(f)
    const ai = t.lastIndexOf("=>")
    return t.substr(ai + 2).trim()
}


const getSelectorFromFunction = (f: ts.ArrowFunction | ts.FunctionExpression, name: string) => {

    const param = f.parameters[0]
    const dg = getDependenciesOfObject(param.name)
    console.log("Dependency graph : ", JSON.stringify(dg));
    const pg = processDependencyObject(dg)
    console.log("Final Dependency Result : ", pg);
    const sType = AstUtils.getTypeOfNode(param)
    const rType = getReturnTypeOfFunction(f)
    return `export const ${name}:Selector<${sType},${rType}> = {fn:${f.getText()},dependencies:${JSON.stringify(pg)}}`
}

const getSelectorFromFunctionExpress = (fe: ts.FunctionExpression) => {

}

const createSelctorSelectorNode = (node: ts.VariableStatement) => {
    const decl = node.declarationList.declarations[0]
    const name = decl.name.getText()
    const ce = decl.initializer! as ts.CallExpression
    const arg = ce.arguments[0]
    let result = ""
    if (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) {
        result = getSelectorFromFunction(arg, name)
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
        if (isSeelctorVariableDeclarationStatement(node)) {
            console.log("seelctor found and processing");
            return createSelctorSelectorNode(node as any);
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
        variableUsage = collectVariableUsage(sf)
        const printer = ts.createPrinter();
        const newSf = ts.transform(sf, [selectorTransformer]).transformed[0];
        const transformedContent = printer.printFile(newSf)
        let imports: string[] = []
        if (!selectorAlreadyImported) {
            imports.push(`import {Selector} from "@typesafe-store/store"`)
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
