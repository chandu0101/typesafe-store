import { GraphqlApiConfig } from "../types";
import { SchemaManager } from "./schema-manager/schema-manager";
import { FileSchemaManager } from "./schema-manager/file-schema-manager";
import { HttpSchemaManager } from "./schema-manager/http-schema-manager";
import * as ts from "typescript"
import { AstUtils } from "../utils/ast-utils";
import { ApiMeta, GraphqlOperation } from "./type";
import { ConfigUtils } from "../utils/config-utils";
import chalk from "chalk"
import { validate } from "graphql/validation"
import { parse, GraphQLSchema, } from "graphql"
import { GraphqlTypGen } from "./typegen"
import { pascal } from "case"
import { FileUtils } from "../utils/file-utils";
import isEmpty from "lodash/isEmpty"



const apiMetaMap: Map<string, ApiMeta> = new Map()
let initialStart: boolean = false



/**
 *  checks whether given Node is graphql query/fragment/mutation/subscription
 * @param node 
 * @param tag 
 */
function isTaggedNode(node: ts.Node, tag: string): boolean {
    if (!node || !node.parent) return false;
    if (!ts.isTaggedTemplateExpression(node.parent)) return false;
    const target = node.parent
    return target.getText() === tag
}

function isTemplateExpression(node: ts.Node) {
    return ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)
}

function processFiles(files: string[], ) {

}

function validateQuery(queryString: string, schema: GraphQLSchema) {
    const ast = parse(queryString)
    return validate(schema, ast)
}

function processFile(file: string, ) {
    try {
        const apiName = ConfigUtils.getGraphqlApiNameFromGraphqlOperationsPath(file)
        const namespaceName = ConfigUtils.getGraphqlOperationVariableNamePrefix(file)
        const meta = apiMetaMap.get(apiName)!
        if (!meta.schemaManager.schema) {
            throw new Error(`Graphql Schema Error : ${meta.schemaManager.error}`)
        }
        const tag = meta.schemaManager.tag;
        const nodes = AstUtils.getAllNodes(file, isTemplateExpression)
            .filter(node => isTaggedNode(node, tag)) as (ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral)[]
        nodes.forEach(node => {
            const gqlString = getTextFromTaggedLiteral(node, file, meta)
            const document = parse(gqlString)
            const errors = validate(meta.schemaManager.schema!, document)
            if (errors) {
                throw new Error(`query : ${gqlString} is not valid, ${JSON.stringify(errors)}`)
            }
            const { isFragment, operation, errorMessage } = GraphqlTypGen.isValidQueryDocument(document)
            if (errorMessage) {
                throw new Error(`query :${gqlString} is not valid , ${errorMessage}`)
            }
            if (operation) { // discard fragment only nodes 
                const variableName = node.parent.parent.getText()
                const { types, operations } = GraphqlTypGen.generateType(document, meta.schemaManager.schema!)
                let responseType = ""
                let bodyType = ""
                let isMultipleOp = false
                if (operations.length > 1) {
                    isMultipleOp = true
                    responseType = `[${operations.map(o => o.name).join(",")}]`
                    bodyType = `[${operations.map(op => `{
                        query: "${gqlString}",
                        ${op.variables === "undefined" ? "" : `variables:${op.variables}`}
                    }`).join(", ")}]`
                } else {
                    responseType = `${operations[0].name}`
                    const op = operations[0]
                    bodyType = `{
                        query: "${gqlString}",
                        ${op.variables === "undefined" ? "" : `variables:${op.variables}`}
                    }`
                }
                //TODO subscription type , subscriptions should be handled via websockets
                const fType = `FetchPost<"${meta.schemaManager.url}",${bodyType},${responseType},"GraphqlError[]">`
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
                writeGraphqlTypesToFile(apiName, meta)
            }


        })
    } catch (error) {
        chalk.red(`Error processing file ${file}: ${error}`)
        return
    }

}

function writeGraphqlTypesToFile(apiName: string, meta: ApiMeta) {
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

    const output = `
    export default namespace ${apiName} {
        ${queries}
        ${mutations}
        ${subscriptions}
    }
   `
    FileUtils.writeFileSync(outputPath, output)
}


function getTextFromTaggedLiteral(node: ts.TemplateExpression | ts.TaggedTemplateExpression | ts.NoSubstitutionTemplateLiteral, file: string, apiMeta: ApiMeta): string {
    const cache = apiMeta.resultCache
    const cachedValue = cache.get(node)

    if (cachedValue) {
        if (cachedValue.dependencyVersions.every(dep => ConfigUtils.getFileVersion(dep.fileName, true) === dep.version)) {
            return cachedValue.gqlText
        } else {
            cache.delete(node)
        }
    }

    const setToCache = (gqlText: string, deps = [file]) => {
        const dependencyVersions = [...new Set(file)].map(d => ({ fileName: d, version: ConfigUtils.getFileVersion(d) }))
        cache.set(node, { gqlText, dependencyVersions })
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

function getTextFromTemplateSpans(file: string, node: ts.Node, apiMeta: ApiMeta, dependencies = [file]): { text: string, dependencies: string[] } {
    const cache = apiMeta.spanNodeCache
    const cacheValue = cache.get(node);
    if (cacheValue) {
        if (cacheValue.dependencyVersions.every(dep => ConfigUtils.getFileVersion(dep.fileName) === dep.version)) {
            return { text: cacheValue.gqlText, dependencies }
        } else {
            cache.delete(node);
        }
    }

    const setValueToCache = ({ text, dependencies }: { text: string; dependencies: string[] }) => {
        cache.set(node, {
            gqlText: text,
            dependencyVersions: [...new Set(dependencies)].map(fileName => ({
                fileName,
                version: ConfigUtils.getFileVersion(file),
            })),
        });
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
export async function generateTypesForGraphqlQueriesInApp(graphqlApis: GraphqlApiConfig[]): Promise<[boolean, string]> {
    let result: [boolean, string] = [true, ""]
    initialStart = true
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
        apiMetaMap.set(gApi.name, {
            schemaManager, resultCache: new Map(),
            spanNodeCache: new Map(), operations: { queries: {}, mutations: {}, subscriptions: {} }
        })

    }))
    initialStart = false
    return result;
}

