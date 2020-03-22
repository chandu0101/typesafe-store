import { RestApiConfig } from "./types";
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

import swagger2openapi from "swagger2openapi";
import { readFileSync } from "fs";
import YAML from "yamljs"

// credits https://github.com/contiamo/restful-react/blob/master/src/scripts/import-open-api.ts





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



export async function generateTypesForRestApiConfig(restApis: RestApiConfig[]): Promise<[boolean, string]> {
    let result: [boolean, string] = [true, ""]
    await Promise.all(restApis.map(async (ra) => {
        const data = readFileSync(ra.openApiSpec, "utf-8")
        let schema = ra.openApiSpec.endsWith(".json") ? JSON.parse(data) : YAML.parse(data)
        if (!schema.openapi || !schema.openapi.startsWith("3.0")) {
            schema = await convertSwaggerToOpenApi(schema)
        }

        console.log("");
    })
    )

    return result;
}

