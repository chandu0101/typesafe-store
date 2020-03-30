import { GraphqlApiConfig, BooleanStringTuple } from "../types";
import { SchemaManager } from "./schema-manager/schema-manager";
import { FileSchemaManager } from "./schema-manager/file-schema-manager";
import { HttpSchemaManager } from "./schema-manager/http-schema-manager";
import * as ts from "typescript"
import { AstUtils } from "../utils/ast-utils";
import { GraphqlApiMeta, GraphqlOperation } from "./types";
import { ConfigUtils } from "../utils/config-utils";
import chalk from "chalk"
import { validate } from "graphql/validation"
import { parse, GraphQLSchema, } from "graphql"
import { GraphqlTypGen } from "./typegen"
import { pascal } from "case"
import { FileUtils } from "../utils/file-utils";
import isEmpty from "lodash/isEmpty"
import { MetaUtils } from "../utils/meta-utils";
import { CommonUtils } from "../utils/common-utils";



// let apiMetaMap = new Map<string, GraphqlApiMeta>()


/**
 *  checks whether given Node is graphql query/fragment/mutation/subscription
 * @param node 
 * @param tag 
 */
function isTaggedNode(node: ts.Node, tag: string): boolean {
    if (!node || !node.parent) return false;
    if (!ts.isTaggedTemplateExpression(node.parent)) return false;
    const target = node.parent
    return target.tag.getText() === tag // target.getText() returning invalid string
}

function isTemplateExpression(node: ts.Node) {
    return ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)
}


export class GraphqlUtils {

    static getGraphqlApiMeta(apiName: string) {
        return MetaUtils.getGraphqlMeta().get(apiName)
    }

    static setGraphqlApiMetaValue(key: string, value: GraphqlApiMeta) {
        const meta = MetaUtils.getGraphqlMeta()
        meta.set(key, value)
    }

    static isValidGraphqlOperationSourceFile(file: string): BooleanStringTuple {
        let result: BooleanStringTuple = [true, ""]
        const graplApis = ConfigUtils.getConfig().graphqlApis
        if (!graplApis || graplApis.length < 1) {
            result = [false, "looks like you didnt configured graplApis in type-safe store config  "]
        } else {
            const apiName = ConfigUtils.getGraphqlApiNameFromGraphqlOperationsPath(file)
            if (graplApis.find(ga => ga.name === apiName)) {
                result = [true, apiName]
            } else {
                result = [false, `apiName : ${apiName} doesn't have valid config in type-safe store config file,please note that name is caseSensitive`]
            }
        }
        return result
    }

    static processFiles(files: string[]) {
        files.forEach(f => {
            processFile(f)
        })
    }
}

const processFile = (file: string, ) => {
    try {
        console.log("Graphql Processing file : ", file);
        const [valid, msg] = GraphqlUtils.isValidGraphqlOperationSourceFile(file)
        if (!valid) {
            throw new Error(msg)
        }
        const apiName = msg;
        const namespaceName = ConfigUtils.getGraphqlOperationVariableNamePrefix(file)
        console.log("nameSpace :", namespaceName);
        const meta = GraphqlUtils.getGraphqlApiMeta(apiName)
        console.log("meta: ", meta);
        if (!meta) {
            throw new Error(`You should create a folder with api name sepcified in config`)
        }
        if (!meta.schemaManager.schema) {
            throw new Error(`Graphql Schema Error : ${meta.schemaManager.error}`)
        }
        const tag = meta.schemaManager.tag;
        console.log("tag : ", tag, "meta: ", meta);
        const templateNodes = AstUtils.findAllNodesFromFile(file, isTemplateExpression)
        const tnp = templateNodes[0].parent
        console.log("tnp : ", tnp);
        const nodes = templateNodes.filter(node => isTaggedNode(node, tag)) as (ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral)[]
        console.log("Tagged Nodes : ", nodes)
        let hasChanges = false
        nodes.forEach(node => {
            const gqlString = getTextFromTaggedLiteral(node, file, meta)
            console.log("gqlString : ", gqlString);
            const document = parse(gqlString)
            const { isFragment, operation, errorMessage } = GraphqlTypGen.isValidQueryDocument(document)
            if (isFragment) { // if its fragment only node then skip
                return
            }
            const errors = validate(meta.schemaManager.schema!, document)
            if (errors.length > 0) {
                throw new Error(`query : ${gqlString} is not valid, ${JSON.stringify(errors)}`)
            }
            if (errorMessage) {
                throw new Error(`query :${gqlString} is not valid , ${errorMessage}`)
            }
            if (operation) {
                const variableName = (node.parent.parent as ts.VariableDeclaration).name.getText() // Todo Check for other than VariableDeclaration(is it possible ?)
                const { types, operations } = GraphqlTypGen.generateType(document, meta.schemaManager.schema!)
                let responseType = ""
                let bodyType = ""
                let isMultipleOp = false

                if (operations.length > 1) {
                    isMultipleOp = true
                    responseType = `[${operations.map(o => o.name).join(",")}]`
                    bodyType = `[${operations.map(op => `{query: \`${gqlString}\`,${op.variables ? `variables:${op.variables}` : ""}}`).join(", ")}]`
                } else {
                    responseType = `${operations[0].name}`
                    const op = operations[0]
                    bodyType = `{query: \`${gqlString}\`,${op.variables ? `variables:${op.variables}` : ""}}`
                }
                //TODO subscription type , subscriptions should be handled via websockets
                const fType = `FetchPost<{path: "${meta.schemaManager.url}"},${bodyType},${responseType},GraphqlError[]>`
                const output = `
                 ${types}
                 export type ${pascal(variableName)} =  ${fType}
                `
                const operationValue = { text: output, isMultipleOp }
                if (operation === GraphqlOperation.QUERY) {
                    meta.operations.queries[namespaceName] = operationValue
                } else if (operation === GraphqlOperation.MUTATION) {
                    meta.operations.mutations[namespaceName] = operationValue
                } else {
                    meta.operations.subscriptions[namespaceName] = operationValue
                }
                hasChanges = true
            }
        })
        if (hasChanges) {
            writeGraphqlTypesToFile(apiName, meta)
        }
    } catch (error) {
        console.log(chalk.red(`Error processing file ${file}: ${error}`))
        return
    }

}

function writeGraphqlTypesToFile(apiName: string, meta: GraphqlApiMeta) {
    const outputPath = ConfigUtils.getGraphqlTypesOutputPath(apiName)
    const operations = meta.operations
    let queries = ""
    let mutations = ""
    let subscriptions = ""
    if (!isEmpty(operations.queries)) {
        const qt = Object.entries(operations.queries).map(([n, ov]) => {
            return `
             export namespace ${n} {
                ${ov.text}
             }
           `
        }).join("\n ")
        queries = `
         export namespace queries {
             ${qt}
         }
       `
    }

    if (!isEmpty(operations.mutations)) {
        const mt = Object.entries(operations.mutations).map(([n, ov]) => {
            return `
             export namespace ${n} {
                ${ov.text}
             }
           `
        }).join("\n ")
        queries = `
         export namespace mutations {
             ${mt}
         }
       `
    }

    if (!isEmpty(operations.mutations)) {
        const st = Object.entries(operations.subscriptions).map(([n, ov]) => {
            return `
             export namespace ${n} {
                ${ov.text}
             }
           `
        }).join("\n ")
        queries = `
         export namespace subscriptions {
             ${st}
         }
       `
    }

    const imports: string[] = []
    if (queries || mutations) {
        imports.push(`import { FetchPost } from "@typesafe-store/reducer"`)
    }
    const output = `
    ${CommonUtils.dontModifyMessage()}
    ${imports.join(";\n")}
    export namespace ${apiName} {
        ${queries}
        ${mutations}
        ${subscriptions}
    }
   `
    FileUtils.writeFileSync(outputPath, output)
}


function getTextFromTaggedLiteral(node: ts.TemplateExpression | ts.TaggedTemplateExpression | ts.NoSubstitutionTemplateLiteral, file: string, apiMeta: GraphqlApiMeta): string {
    const cache = apiMeta.resultCache
    const buildInfoExist = ConfigUtils.isTsBuildInfoExist()
    if (buildInfoExist) {
        const cachedValue = cache.get(node)

        if (cachedValue) {
            if (cachedValue.dependencyVersions.every(dep => ConfigUtils.getFileVersion(dep.fileName, true) === dep.version)) {
                return cachedValue.gqlText
            } else {
                cache.delete(node)
            }
        }
    }

    const setToCache = (gqlText: string, deps = [file]) => {
        if (buildInfoExist) {
            const dependencyVersions = [...new Set(file)].map(d => ({ fileName: d, version: ConfigUtils.getFileVersion(d) }))
            cache.set(node, { gqlText, dependencyVersions })
        }
        return gqlText
    }

    if (ts.isNoSubstitutionTemplateLiteral(node)) {
        return setToCache(node.text)
    }

    let template: ts.TemplateExpression;
    if (ts.isTemplateExpression(node)) {
        template = node;
    } else if (ts.isTemplateExpression(node.template)) {
        template = node.template;
    } else if (ts.isNoSubstitutionTemplateLiteral(node.template)) {
        return setToCache(node.template.text);
    } else {
        return ""
    }
    let dependencies = [file]

    const head = template.head;
    let headLength = head.text.length;
    const texts = [head.text];
    for (const spanNode of template.templateSpans) {
        const { text: stringForSpan, dependencies: childDeps } = getTextFromTemplateSpans(
            file,
            spanNode.expression,
            apiMeta,
            dependencies,
        );
        headLength += stringForSpan.length;
        texts.push(stringForSpan);
        headLength += spanNode.literal.text.length;
        texts.push(spanNode.literal.text);
        dependencies = [...dependencies, ...childDeps];
    }

    const combinedText = texts.join('');
    return setToCache(
        combinedText,
        dependencies
    );

}

function getTextFromTemplateSpans(file: string, node: ts.Node, apiMeta: GraphqlApiMeta, dependencies = [file]): { text: string, dependencies: string[] } {
    const cache = apiMeta.spanNodeCache
    const buildInfoExist = ConfigUtils.isTsBuildInfoExist()
    if (buildInfoExist) {
        const cacheValue = cache.get(node);
        if (cacheValue) {
            if (cacheValue.dependencyVersions.every(dep => ConfigUtils.getFileVersion(dep.fileName) === dep.version)) {
                return { text: cacheValue.gqlText, dependencies }
            } else {
                cache.delete(node);
            }
        }
    }

    const setValueToCache = ({ text, dependencies }: { text: string; dependencies: string[] }) => {
        if (buildInfoExist) {
            cache.set(node, {
                gqlText: text,
                dependencyVersions: [...new Set(dependencies)].map(fileName => ({
                    fileName,
                    version: ConfigUtils.getFileVersion(file),
                })),
            });
        }
        return { text, dependencies };
    };

    const getValueForTemplateExpression = (node: ts.TemplateExpression, dependencies: string[]) => {
        const texts = [node.head.text];
        let newDependenciees = [...dependencies];
        for (const span of node.templateSpans) {
            const { text: stringForSpan, dependencies: childDepes } = getTextFromTemplateSpans(
                file,
                span.expression,
                apiMeta,
                dependencies,
            );
            texts.push(stringForSpan);
            texts.push(span.literal.text);
            newDependenciees = [...newDependenciees, ...childDepes];
        }
        return { text: texts.join(''), dependencies: newDependenciees };
    };

    if (ts.isStringLiteral(node)) {
        return setValueToCache({ text: node.text, dependencies });
    } else if (ts.isNoSubstitutionTemplateLiteral(node)) {
        return setValueToCache({ text: node.text, dependencies });
    } else if (ts.isIdentifier(node)) {
        let currentFileName = file;
        let currentNode: ts.Node = node;
        while (true) {
            // const defs = this._langService.getDefinitionAtPosition(currentFileName, currentNode.getStart());
            // if (!defs || !defs[0]) return { dependencies };
            // const def = defs[0];
            // const src = this._langService.getProgram()!.getSourceFile(def.fileName);
            // if (!src) return { dependencies };
            const def = AstUtils.getDefnitionOfIdentifierNode(currentFileName, currentNode)
            // const src = AstUtils.getSourceFile(filePath)!
            const found = AstUtils.findNode(def.fileName, def.textSpan.start); //def.textSpan.start
            if (!found || !found.parent) return { text: "", dependencies };
            currentFileName = def.fileName;
            if (ts.isVariableDeclaration(found.parent) && found.parent.initializer) {
                currentNode = found.parent.initializer;
            } else if (ts.isPropertyDeclaration(found.parent) && found.parent.initializer) {
                currentNode = found.parent.initializer;
            } else if (ts.isPropertyAssignment(found.parent)) {
                currentNode = found.parent.initializer;
            } else if (ts.isShorthandPropertyAssignment(found.parent)) {
                currentNode = found;
            } else {
                return { text: "", dependencies };
            }
            if (ts.isIdentifier(currentNode)) {
                continue;
            }
            return setValueToCache(
                getTextFromTemplateSpans(currentFileName, currentNode, apiMeta, [...dependencies, currentFileName]),
            );
        }
    } else if (ts.isPropertyAccessExpression(node)) {
        return setValueToCache(getTextFromTemplateSpans(file, node.name, apiMeta, dependencies));
    } else if (ts.isTaggedTemplateExpression(node)) {
        if (ts.isNoSubstitutionTemplateLiteral(node.template)) {
            return setValueToCache({ text: node.template.text, dependencies });
        } else {
            return setValueToCache(getValueForTemplateExpression(node.template, dependencies));
        }
    } else if (ts.isTemplateExpression(node)) {
        return setValueToCache(getValueForTemplateExpression(node, dependencies));
    }
    return { text: "", dependencies };

}

/**
 *  
 */
export const initializeGraphqlConfig = async (graphqlApis: GraphqlApiConfig[]): Promise<[boolean, string]> => {
    console.log("initializeGraphqlConfig :", graphqlApis);
    let result: [boolean, string] = [true, ""]
    await Promise.all(graphqlApis.map(async (gApi) => {
        if (!gApi.file && !gApi.http) {
            throw new Error(`graphqlAPis config  ${gApi.name} : you should provide either file or url.`)
        }
        if (gApi.file && gApi.http) {
            throw new Error(`graphqlAPis config  ${gApi.name} : you should provide either file or url not both.`)
        }
        let schemaManager: SchemaManager = null as any
        if (gApi.file) {
            schemaManager = new FileSchemaManager(gApi.file, gApi.tag)
        } else {
            schemaManager = new HttpSchemaManager(gApi.http!, gApi.tag)
        }
        await schemaManager.readSchema()
        if (schemaManager.error) {
            throw new Error(schemaManager.error)
        }
        console.log("setting apiName: ", gApi.name);
        GraphqlUtils.setGraphqlApiMetaValue(gApi.name, {
            schemaManager, resultCache: new Map(),
            spanNodeCache: new Map(), operations: { queries: {}, mutations: {}, subscriptions: {} }
        })

    }))
    return result;
}

