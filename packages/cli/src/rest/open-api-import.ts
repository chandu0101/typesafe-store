import { RestApiConfig, HttpUrlConfig, OpenApiSpecFormat, ContentType } from "../types";
import set from "lodash/set"
import { pascal, camel } from "case"
import isEmpty from "lodash/isEmpty"
import uniq from "lodash/uniq"
import get from "lodash/get"
import {
    ComponentsObject,
    OpenAPIObject,
    OperationObject,
    ParameterObject,
    PathItemObject,
    ReferenceObject,
    RequestBodyObject,
    ResponseObject,
    SchemaObject,
} from "openapi3-ts";
import validator from "ibm-openapi-validator";

// import JsYaml from "js-yaml"

import swagger2openapi from "swagger2openapi";
import { readFileSync, existsSync } from "fs";
import groupBy from "lodash/groupBy"
//@ts-ignore
import JsYaml from "js-yaml"
import chalk from "chalk"
import { ConfigUtils } from "../utils/config-utils";
import { FileUtils } from "../utils/file-utils";
import { CommonUtils } from "../utils/common-utils";

// credits https://github.com/contiamo/restful-react/blob/master/src/scripts/import-open-api.ts

//contants 

const ERROR_READING_OPENAPI_SPEC = "Error while reading OpenApiSpec"

const IdentifierRegexp = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;



/**
 * 
 * @param schema 
 */
function isReference(schema: any): schema is ReferenceObject {
    return Boolean(schema.$ref)
}

/**
 *  resolves [Discriminator](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.3.md#discriminator-object) in spec
 * @param spec openApiSepc
 */
function resolveDiscriminators(spec: OpenAPIObject) {
    if (spec.components && spec.components.schemas) {
        Object.values(spec.components.schemas).forEach(schema => {
            if (isReference(schema) || !schema.discriminator || !schema.discriminator.mapping) {
                return
            }
            const { mapping, propertyName } = schema.discriminator
            const validRefPath = "#/components/schemas/"
            Object.entries(mapping).forEach(([name, ref]) => {
                if (!ref.startsWith(validRefPath)) {
                    throw new Error(`${ERROR_READING_OPENAPI_SPEC} : Discriminator mapping outside of "${validRefPath}" is not supported`)
                }
                set(spec, `components.schemas.${ref.slice(validRefPath.length)}.properties.${propertyName}.enum`, [name])
            })

        })
    }
}


function convertSwaggerToOpenApi(schema: any): Promise<OpenAPIObject> {
    return new Promise((resolve, reject) => {
        swagger2openapi.convertObj(schema, {}, (err, convertedObj) => {
            if (err) {
                reject(err);
            } else {
                resolve(convertedObj.openapi);
            }
        });
    })
}

async function importSpec({ data, format }: { data: string, format: OpenApiSpecFormat }): Promise<OpenAPIObject> {
    let specs: OpenAPIObject = format === "json" ? JSON.parse(data) : JsYaml.safeLoad(data)
    console.log("yaml parsed ");
    if (!specs.openapi || !specs.openapi.startsWith("3.0")) {
        specs = await convertSwaggerToOpenApi(specs)
    }
    return specs
}

async function requestRestApiConfigUrl(url: HttpUrlConfig): Promise<{ data: string, format: OpenApiSpecFormat }> {
    const options: Record<string, any> = {}
    if (url.method) {
        options.method = url.method;
    }
    if (url.headers) {
        options.headers = url.headers
    }
    if (url.body) {
        options.body = JSON.stringify(url.body)
    }
    const resp = await fetch(url.url, options)
    if (!resp.ok) {
        throw new Error(`Request to ${url.url} failed with error : ${resp.statusText}`)
    }

    let format: OpenApiSpecFormat = "yaml"
    if (url.url.endsWith(".json") || resp.headers.get("Content-Type") === ContentType.APPLICATION_JSON) {
        format = "json"
    }
    const data = await resp.text()
    return { data, format }
}

function getRef($ref: ReferenceObject["$ref"]) {
    if ($ref.startsWith("#/components/schemas")) {
        return pascal($ref.replace("#/components/schemas/", ""))
    } else if ($ref.startsWith("#/components/responses")) {
        return pascal($ref.replace("#/components/responses/", "")) + "Response";
    } else if ($ref.startsWith("#/components/parameters")) {
        return pascal($ref.replace("#/components/parameters/", "")) + "Parameter";
    } else if ($ref.startsWith("#/components/requestBodies")) {
        return pascal($ref.replace("#/components/requestBodies/", "")) + "RequestBody";
    }
    else {
        throw new Error(`${ERROR_READING_OPENAPI_SPEC} : This library only resolve $ref that are include into "#components/*" for now`)
    }
}

/**
 * 
 * @param schema 
 */
function resolveValue(schema: SchemaObject) {
    return isReference(schema) ? getRef(schema.$ref) : getScalar(schema)
}

/**
 * 
 * @param item 
 */
function getArray(item: SchemaObject): string {
    if (item.items) {
        return `${resolveValue(item.items)}[]`
    } else {
        throw new Error(`${ERROR_READING_OPENAPI_SPEC} : All array items must have "array" key define `)
    }
}

/**
 * 
 * @param item 
 */
function getObject(item: SchemaObject): string {
    if (isReference(item)) {
        return getRef(item.$ref)
    }

    if (item.allOf) {
        return item.allOf.map(resolveValue).join(" & ")
    }

    if (item.oneOf) {
        return item.oneOf.map(resolveValue).join(" | ")
    }

    if (!item.type && !item.properties && !item.additionalProperties) {
        return "{}"
    }

    // Free form object (https://swagger.io/docs/specification/data-models/data-types/#free-form)
    if (item.type === "object" && !item.properties && (!item.additionalProperties || item.additionalProperties === true || isEmpty(item.additionalProperties))) {
        return "{ [key:string]: any}"
    }

    let output = "{\n"
    if (item.properties) {
        output += Object.entries(item.properties)
            .map(([key, prop]: [string, ReferenceObject | SchemaObject]) => {
                const doc = isReference(prop) ? "" : formatDescription(prop.description, 2)
                const isRequired = (item.required || []).includes(key)
                const processedKey = IdentifierRegexp.test(key) ? key : `"${key}"`
                return ` ${doc} readonly ${processedKey}${isRequired ? "" : "?"}: ${resolveValue(prop)}`
            }).join("\n")
    }
    if (item.additionalProperties) {
        if (item.properties) {
            output += "\n"
        }
        output += ` [key: string]: ${item.additionalProperties === true ? "any" : resolveValue(item.additionalProperties)}`
    }

    if (item.properties || item.additionalProperties) {
        if (output === "{\n") return "{}"
        return output + "\n}"
    }
    return item.type === "object" ? "{[key:string]:any}" : "any"
}

/**
 * 
 * @param item 
 */
function getScalar(item: SchemaObject): string {
    const nullable = item.nullable ? " | null" : ""
    switch (item.type) {
        case "integer":
        case "int32":
        case "int64":
        case "float":
        case "double":
        case "number":
            return "number" + nullable
        case "string":
        case "byte":
        case "binary":
        case "date-time":
        case "dateTime":
        case "password":
            return (item.enum ? `"${item.enum.join(`" | "`)}"` : "string" + nullable)
        case "boolean":
            return "boolean" + nullable
        case "array":
            return getArray(item) + nullable
        case "object":
        default:
            return getObject(item) + nullable

    }

}

/**
 * 
 * @param description 
 * @param tabSize 
 */
function formatDescription(description?: string, tabSize = 0) {
    return description ? `/**\n${description
        .split("\n")
        .map(i => `${" ".repeat(tabSize)} * ${i}`)
        .join("\n")}\n${" ".repeat(tabSize)} */\n${" ".repeat(tabSize)}` : ""
}

/**
 * 
 * @param name 
 * @param schema 
 */
function generateInterface(name: string, schema: SchemaObject) {
    const scalar = getScalar(schema)
    return `${formatDescription(schema.description)}export interface ${pascal(name)} ${scalar}`
}

/**
 * 
 * @param responsesOrRequestes 
 */
function getReqResTypes(responsesOrRequestes: Array<[string, ResponseObject | ReferenceObject | RequestBodyObject]>) {
    return uniq(
        responsesOrRequestes.map(([_, res]) => {
            if (!res) {
                return "void"
            }
            if (isReference(res)) {
                return getRef(res.$ref)
            }
            if (res.content) {
                for (let contentType of Object.keys(res.content)) {
                    if (contentType.startsWith(ContentType.APPLICATION_JSON) || contentType.startsWith(ContentType.APPLICATION_OCTET_STREAM)) {
                        const schema = res.content[contentType].schema!;
                        return resolveValue(schema)
                    }
                }
                return "void"
            }
            return "void"
        })
    ).join(" | ")
}


/**
 * 
 * @param requestBodies 
 */
function generateRequestBodiesDefinition(requestBodies: ComponentsObject["requestBodies"] = {}): string {
    if (isEmpty(requestBodies)) {
        return ""
    }
    return (
        "\n" +
        Object.entries(requestBodies)
            .map(([name, requestBody]) => {
                const doc = isReference(requestBody) ? "" : formatDescription(requestBody.description)
                const type = getReqResTypes([["", requestBody]])
                const isEmptyInterface = type === "{}"
                if (isEmptyInterface) {
                    return `// tslint:disable-next-line:no-empty-interface
                   export interface ${pascal(name)}RequestBody ${type} `
                } else if (type.includes("{") && !type.includes("|") && !type.includes("&")) {
                    return `${doc}export interface ${pascal(name)}RequestBody ${type}`
                } else {
                    return `${doc}export type ${pascal(name)}RequestBody = ${type}`
                }
            }).join("\n\n") +
        "\n"
    )
}

/**
 * 
 * @param responses 
 */
function generateResponseDefinition(responses: ComponentsObject["responses"] = {}): string {
    if (isEmpty(responses)) {
        return ""
    }

    return ("\n" +
        Object.entries(responses)
            .map(([name, response]) => {
                const doc = isReference(response) ? "" : formatDescription(response.description)
                const type = getReqResTypes([["", response]])
                const isEmptyInterface = type === "{}"
                if (isEmptyInterface) {
                    return `// tslint:disable-next-line:no-empty-interface
                   export interface ${pascal(name)}Response ${type} `
                } else if (type.includes("{") && !type.includes("|") && !type.includes("&")) {
                    return `${doc}export interface ${pascal(name)}Response ${type}`
                } else {
                    return `${doc}export type ${pascal(name)}Response = ${type}`
                }
            }).join("\n\n")
        + "\n")

}

/**
 * 
 * @param schemas 
 */
function generateSchemaDefinitions(schemas: ComponentsObject["schemas"] = {}) {
    if (isEmpty(schemas)) {
        return ""
    }

    return Object.entries(schemas).map(([name, schema]) =>
        !isReference(schema) && (!schema.type || schema.type === "object") && !schema.allOf && !schema.oneOf && !schema.nullable ? generateInterface(name, schema) :
            `${formatDescription(isReference(schema) ? undefined : schema.description)} export type ${pascal(name)} = ${resolveValue(schema)}`).join("\n\n") + "\n"

}


/**
 * 
 * @param path 
 */
function getParamsInPath(path: string) {
    let n;
    const output = [];
    const templatePathRegex = /\{(\w+)}/g;
    // tslint:disable-next-line:no-conditional-assignment
    while ((n = templatePathRegex.exec(path)) !== null) {
        output.push(n[1])
    }
    return output;
}


/**
 * 
 */
function generatePathTypes(spec: OpenAPIObject, apiName: string): { types: string, requestCreators: string[] } {
    let serverPath = ""
    const servers = spec.servers
    const paths = spec.paths
    const schemaComponents = spec.components
    if (servers) {
        serverPath = servers[0].url
    }
    const operationIds: string[] = []
    let pathResults: string[] = []
    const requestCreators: string[] = []
    const typesImportName = `${apiName.replace(/-/g, "_")}Types`
    Object.entries(paths).forEach(([route, po]: [string, PathItemObject]) => {
        Object.entries(po).forEach(([verb, op]: [string, OperationObject]) => {
            if (["get", "post", "put", "delete", "patch"].includes(verb)) {
                if (!op.operationId) {
                    throw new Error(`${ERROR_READING_OPENAPI_SPEC} : You should provide a unique operationId for each operation`)
                }
                if (operationIds.includes(op.operationId)) {
                    throw new Error(`${ERROR_READING_OPENAPI_SPEC} :  ${op.operationId} is already taken by another operation, please provide a unique operation `)
                }
                operationIds.push(op.operationId)
                const operationId = op.operationId
                const { query: queryParams = [], header: headerParams = [], path: pathParams = [] } = groupBy([...(po.parameters || []), ...(op.parameters || [])].map<ParameterObject>(p => {
                    if (isReference(p)) {
                        return get(schemaComponents, p.$ref.replace("#/components/", "").replace("/", "."))
                    } else {
                        return p
                    }
                }), "in")
                const paramsInRoute = getParamsInPath(route)
                let pathParamsType: string | undefined = undefined
                if (paramsInRoute.length) {
                    pathParamsType = `{ ${paramsInRoute.map(pr => {
                        const po = pathParams.find(po => po.name === pr)
                        if (!po) {
                            throw new Error(`${ERROR_READING_OPENAPI_SPEC} : ParameterObject for ${pr} is not in ${op.operationId} `)
                        }
                        return `${pr} :${resolveValue(po.schema!)}${po.required ? "" : " | undefined"}`
                    }).join(", ")} }`
                }
                let queryParamsType: string | undefined = undefined
                if (queryParams.length) {
                    queryParamsType = `{ 
                       ${queryParams.map(qp => {
                        const processName = IdentifierRegexp.test(qp.name) ? qp.name : `"${qp.name}"`
                        return `${formatDescription(qp.description, 2)}${processName}:${resolveValue(qp.schema!)} ${qp.required ? "" : " | undefined"}`
                    }).join(", ")}
                   }`
                }
                const isOk = ([statusCode]: [string, ResponseObject | ReferenceObject]) => statusCode.toString().startsWith("2")
                const isError = ([statusCode]: [string, ResponseObject | ReferenceObject]) => statusCode.toString().startsWith("4")
                    || statusCode.toString().startsWith("5") || statusCode === "default"
                const responseTypes = getReqResTypes(Object.entries(op.responses).filter(isOk)) || "null"
                const errorTypes = getReqResTypes(Object.entries(op.responses).filter(isError)) || "unknown"
                let requestBodyTypes = getReqResTypes([["body", op.requestBody!]])
                if (requestBodyTypes === "void") {
                    requestBodyTypes = "null"
                }
                let operationIdPascal = pascal(operationId)
                const operationResponseType = `export type ${operationIdPascal}Response = ${responseTypes}`
                const operationRequestBodyType = `export type ${operationIdPascal}Body = ${requestBodyTypes}`
                const operationIdErrorType = `export type ${operationIdPascal}Error = ${errorTypes}`
                const operationIdNamespace = camel(operationId)
                let type = ""
                const path = `${serverPath}${route}`
                const urlType = `{path:"${path}"${pathParamsType ? `,params:${pathParamsType}` : ""}${queryParamsType ? `, queryParams:${queryParamsType}` : ""}}`

                if (verb === "get") {
                    type = `Fetch<${urlType},${operationIdPascal}Response,${operationIdPascal}Error,T>`
                } else {
                    type = `Fetch${pascal(verb)}<${urlType},${operationIdPascal}Body,${operationIdPascal}Response,${operationIdPascal}Error,T>`
                }
                let rcResponseType: string | undefined = ""
                if (responseTypes === "void" || responseTypes === "null" || responseTypes === "undefined") {
                    rcResponseType = undefined
                } else {
                    rcResponseType = `${typesImportName}.requests.${operationIdNamespace}.${operationIdPascal}Response`
                }
                let rcBodyType: string | undefined = undefined
                if (requestBodyTypes === "null" || requestBodyTypes === "undefined" || requestBodyTypes === "void") {
                    rcBodyType = undefined
                } else {
                    rcBodyType = `${typesImportName}.requests.${operationIdNamespace}.${operationIdPascal}Body`
                }
                //TODO abortable,offline
                let paramsA = [{ name: "pathParams", value: pathParamsType },
                { name: "queryParams", value: queryParamsType }, { name: "body", value: rcBodyType },
                { name: "optimisticResponse ?", value: rcResponseType },
                { name: "abortable", type: "boolean", optional: true }, { name: "offline", type: "boolean", optional: true }]
                let params = paramsA.map(v => {
                    if (v.value && v.value !== "undefined" && v.value !== "null" && v.value !== "void") {
                        return `${v.name}: ${v.value}`
                    } else if (v.type && v.optional) {
                        return `${v.name} ${v.optional ? "?" : ""}:${v.type}`
                    }
                    else {
                        return ""
                    }
                }).filter(v => v.length > 0).join(", ")
                if (params.length) {
                    params = `input: {${params}}`
                }

                const requestCreator = `
                   static  ${camel(operationId)}Request(${params}) {
                         return {
                           type:FetchVariants.${verb.toUpperCase()} , url : {path:"${path}"${pathParamsType ? ",params:input.pathParams" : ""}${queryParamsType ? `, queryParams: input.queryParams` : ""}}
                             ${rcBodyType ? ", body: input.body" : ""} ${rcResponseType ? ",optimisticResponse:input.optimisticResponse" : ""},
                             _abortable:input.abortable, offline:input.offline
                         }
                     }
                `
                requestCreators.push(requestCreator)
                const pathResult = `
                  export namespace ${operationIdNamespace} {
                     ${operationRequestBodyType}
                     ${operationResponseType}
                     ${operationIdErrorType}
                     export type Request<T extends FetchTransform<${operationIdPascal}Response, any> | null = null> = ${type}
                  }
                `
                pathResults.push(pathResult)
            }
        })
    })
    const types = `
       export namespace requests {
          ${pathResults.join("\n")}
       }
    `
    return { types, requestCreators }
}



export async function generateTypesForRestApiConfig(restApis: RestApiConfig[]): Promise<[boolean, string]> {
    let result: [boolean, string] = [true, ""]
    await Promise.all(restApis.map(async (rApi) => {
        if (!rApi.file && !rApi.http) {
            throw new Error(`restApis config  ${rApi.name} : you should provide either file or url.`)
        }
        if (rApi.file && rApi.http) {
            throw new Error(`restApis config  ${rApi.name} : you should provide either file or url not both.`)
        }
        let spec: OpenAPIObject = null as any
        if (rApi.file) {
            const file = rApi.file
            if (!existsSync(file) && !(file.endsWith(".json") || file.endsWith(".yaml") || file.endsWith(".yml"))) {
                throw new Error(`restApis config ${rApi.name} : you should provide valid openApiSpec file with extension .yaml/.yml/.json`)
            }
            const data = readFileSync(file, "utf-8")
            console.log("sucessfully read from file");
            const format = file.endsWith(".json") ? "json" : "yaml"
            spec = await importSpec({ data, format })
        }

        if (rApi.http) {
            const url = rApi.http
            const { data, format } = await requestRestApiConfigUrl(url)
            spec = await importSpec({ data, format })
        }

        const validationResult = await validator(spec, true)

        console.log("validationResult", validationResult);

        // if (validationResult.errors.length > 0) {
        //     throw new Error(`Open API Spec is not valid : ${JSON.stringify(validationResult.errors)}`)
        // }

        resolveDiscriminators(spec)

        const schemas = generateSchemaDefinitions(spec.components && spec.components.schemas)

        const reqBodies = generateRequestBodiesDefinition(spec.components && spec.components.requestBodies)

        const responses = generateResponseDefinition(spec.components && spec.components.responses)

        const { types: pathTypes, requestCreators } = generatePathTypes(spec, rApi.name)

        const haveGet = pathTypes.includes("Fetch<")
        const havePost = pathTypes.includes("FetchPost<")
        const haveDelete = pathTypes.includes("FetchDelete<")
        const havePatch = pathTypes.includes("FetchPatch<")
        const havePut = pathTypes.includes("FetchPut<")
        const fetchImports: string[] = ["FUrl"]
        if (haveGet) {
            fetchImports.push("Fetch")
        }
        if (havePut) {
            fetchImports.push("FetchPut")
        }
        if (havePost) {
            fetchImports.push("FetchPost")
        }
        if (haveDelete) {
            fetchImports.push("FetchDelete")
        }
        if (havePatch) {
            fetchImports.push("FetchPatch")
        }
        const nameSpaceName = rApi.name.replace(/-/g, "_")
        const nameSpaceNameTypes = `${nameSpaceName}Types`
        const output = `
         ${CommonUtils.dontModifyMessage()} 
         import {${fetchImports.join(",")},FetchTransform}  from "@typesafe-store/store"

          namespace ${nameSpaceNameTypes} {
             ${schemas}
             ${reqBodies}
             ${responses}
             ${pathTypes}
         }

         export default ${nameSpaceNameTypes}
        `

        const outFile = ConfigUtils.getRestApiOutputFilePathForTypes(rApi.name)
        FileUtils.writeFileSync(outFile, output)

        const rcOutFile = ConfigUtils.getRestApiOutputFilePathForRequestCreators(rApi.name)
        const rcImports = []
        rcImports.push(`import ${nameSpaceNameTypes} from "../types"`)
        rcImports.push(`import {FetchVariants} from "@typesafe-store/store"`)
        const className = `${pascal(nameSpaceName)}RequestCreators`
        const rcOut = `
         ${rcImports.join("\n")}

         class ${className} {
            ${requestCreators.join("\n")}
         }
        
         export default ${className}
        `
        FileUtils.writeFileSync(rcOutFile, rcOut)
        console.info(chalk.yellow(`Successfully generated types for ${rApi.name}.`));

    })
    )

    return result;
}

