import * as ts from "typescript"
import { AstUtils } from "../utils/ast-utils";
import { CommonUtils } from "../utils/common-utils";
import { ConfigUtils } from "../utils/config-utils";
import { FileUtils } from "../utils/file-utils";
import chalk = require("chalk");
import { performance } from "perf_hooks"
import { collectVariableUsage, UsageDomain } from "tsutils"

let currentProcessingFile: string = ""

let variableUsage: ReturnType<typeof collectVariableUsage> = null as any

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


const getStringVersionOfPropertyAccessExpression = (i: ts.PropertyAccessExpression) => {
    return i.getText().split(".").map(d => d.replace("?", "").replace("!", "")).join(".")
}

const getStringVersionOfElementAccessExpression = (i: ts.ElementAccessExpression) => {
    return i.getText().split(".").map(s => {
        const i = s.indexOf("[")
        let ir = ""
        if (i > 0) {
            ir = s.substr(0, i)
        } else {
            ir = s
        }
        return ir.replace("?", "").replace("!", "")
    }).join(".")
}






type DependenciesOfObject = { parent: string, values: { value: string, childDeps?: DependenciesOfObject }[] }


// type 

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




const getSelectorFromArrowFunction = (af: ts.ArrowFunction) => {

    const param = af.parameters[0].name
    const dg = getDependenciesOfObject(param)
    console.log("Dependency graph : ", JSON.stringify(dg));
    // const nodes = AstUtils.findAllNodesInsideNode(af.body, (node: ts.Node) => AstUtils.isPropertyOrElementAccessExpression(node, param))
    //  const 
    // console.log("nodes:", nodes);

    // console.log("State mutations : ", nodes.map(n => n.getText()).join(" "));

    return ""
}

const createSelctorSelectorNode = (node: ts.VariableStatement) => {
    const decl = node.declarationList.declarations[0]
    const name = decl.name.getText()
    const ce = decl.initializer! as ts.CallExpression
    const arg = ce.arguments[0]
    let result = ""
    if (ts.isArrowFunction(arg)) {
        result = getSelectorFromArrowFunction(arg)
    } else {

    }
    return ts.createIdentifier(result)
}



const selectorTransformer: ts.TransformerFactory<ts.SourceFile> = context => {
    const visit: ts.Visitor = node => {
        node = ts.visitEachChild(node, visit, context);
        if (isSeelctorVariableDeclarationStatement(node)) {
            console.log("seelctor found and processing");
            return createSelctorSelectorNode(node as any);
        }
        if (ts.isImportDeclaration(node)) {
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
        let imports = ""

        const output = `
           ${CommonUtils.dontModifyMessage()}
           ${imports}
           ${transformedContent}
          `;
        const outFile = ConfigUtils.getOutputPathForSelectorSourceFile(file)
        console.log("******* writing to out file : ", outFile);
        console.log("outFile : ", outFile);
        // FileUtils.writeFileSync(outFile, output);
        const t1 = performance.now();
        console.log("time : ", t1 - t0, " ms");

    } catch (error) {
        console.log(chalk.red(`Error Processing file ${file} : ${error}`))
    }

}

export function transformSelectorFiles(files: string[]) {

    files.forEach(f => {
        transformFile(f)
    })
}
