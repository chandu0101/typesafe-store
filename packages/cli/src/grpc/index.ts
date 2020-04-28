import { GrpcApiConfig, typeSafeStoreConfigDecoder } from "../types";
import * as protoParser from 'proto-parser';
import { SyntaxType } from "proto-parser"
import { FileUtils } from "../utils/file-utils";
import { existsSync, fstat } from "fs";
import { ConfigUtils } from "../utils/config-utils";
import { pascal, of } from "case"
import { join, dirname, resolve, sep, relative } from "path"


export class GrpcUtil {

}


type NestedType = Record<string, protoParser.NamespaceBase>

const getMessages = (ast: NestedType) => {
    let result: protoParser.MessageDefinition[] = []
    Object.entries(ast).forEach(([key, value]) => {
        console.log("key", key, "type: ", value.syntaxType);
        if (value.syntaxType === SyntaxType.NamespaceDefinition) {
            const nResults = getMessages(value.nested!)
            result.push(...nResults)
        }
        if (value.syntaxType === SyntaxType.MessageDefinition) {
            result.push(value as any)
        }
    }
    )
    return result;
}



const convertFieldDefToTSField = (fd: protoParser.FieldDefinition) => {

}

const convertBaseTypeToTSType = (bt: protoParser.BaseType): string => {
    let result = bt.value.toString()
    switch (bt.value) {
        case "bool":
            {
                result = "boolean"
                break;
            }

        case "double":
        case "fixed32":
        case "fixed64":
        case "float":
        case "int32":
        case "int64":
        case "sfixed32":
        case "sfixed64":
        case "sint32":
        case "sint64":
            {
                result = "number"
                break;
            }
        case "string":
            {
                result = "string"
                break;
            }
        case "bytes": {
            {
                result = "Uint8Array | string"
                break
            }
        }
        default:
            break;
    }

    return result;
}

const convertEnumDefToTSEnum = (ed: protoParser.EnumDefinition, packageName?: string): [string, string] => {
    const name = getTSTypeNameFromFullName(ed.fullName!, packageName)
    const values = Object.entries(ed.values).map(([key, value]) => `${key} = ${value}`)
    const code = `export const enum ${name} {
        ${values.join(",\n")}
    } `
    return [code, name]
}

const getTypeForImportFile = (input: {
    file: string,
    resolvedValue: string, dotted: string, publicImports: string[], tracking: GenerateProtoFileInput["typesConfig"]["typesTracking"], type: string
}): string => {
    const { file, resolvedValue, dotted, publicImports, tracking, type } = input;
    let result = ""
    tracking[file].types.some(t => {
        if (t.name === resolvedValue) {
            result = type.replace(dotted, dotted.split(".").join("_"))
            return true
        }
    })
    if (!result.length) { // its imported from public imports 
        const imports = tracking[file].imports.filter(i => i.public)
        imports.some(i => {
            const br = tracking[i.name].types.some(t => {
                if (t.name === resolvedValue) {
                    const is = i.name.split("/")
                    const ns = is.slice(0, -1).join("_")
                    publicImports.push(`import ${ns} from "./${is.join("/").replace(".proto", "")}" `)
                    result = type.replace(dotted, ns)
                    return true
                }
            })
            if (br) {
                return true
            }
        })
    }

    return result;
}


const convertMessageDefToTSType = (input: {
    md: protoParser.MessageDefinition,
    typesTracking: GenerateProtoFileInput["typesConfig"]["typesTracking"],
    file: string,
    publicImports: string[]
    enums: Record<string, string>, imports: Record<string, string>,
}): string => {
    const { md, enums, file, imports, typesTracking, publicImports } = input
    console.log("convertMessageDefToTSType", input);
    console.log("************** Type fullname : ", md.fullName);
    typesTracking[file].types.push({ name: md.fullName || md.name, type: PIdentifierType.MESSAGE })
    const fields: string[] = []
    const packageName = typesTracking[file].package
    let nested: NestedType = (md as any).nested
    if (nested) {
        Object.entries(nested).forEach(([key, value]) => {
            if (value.syntaxType === SyntaxType.EnumDefinition) {
                typesTracking[file].types.push({ name: value.fullName || value.name, type: PIdentifierType.ENUM })
                const [e, n] = convertEnumDefToTSEnum(value as any, packageName)
                enums[n] = e;
            } else if (value.syntaxType === SyntaxType.MessageDefinition) {
                console.log("*********** nested ", value.fullName, value.name);
                typesTracking[file].types.push({ name: value.fullName || value.name, type: PIdentifierType.MESSAGE })
                const m = convertMessageDefToTSType({
                    md: value as any, enums, imports, typesTracking, file, publicImports,
                })
                const name = getTSTypeNameFromFullName(value.fullName!, packageName)
                const code = `export type ${name} = ${m} `
                enums[name] = code;
            }
        })
    }

    Object.entries(md.fields).forEach(([key, fd]) => {
        console.log("field: ", fd);
        if (fd.type.syntaxType === SyntaxType.BaseType) {
            if (fd.map) {
                let keyTpe = fd.keyType?.syntaxType === SyntaxType.BaseType ? convertBaseTypeToTSType(fd.keyType) : fd.keyType!.value
                const valueType = convertBaseTypeToTSType(fd.type)
                fields.push(`${fd.name}:Record<${keyTpe},${valueType}>`)
            } else {
                let tsType = convertBaseTypeToTSType(fd.type)
                if (fd.repeated) {
                    tsType = `${tsType}[]`
                }
                fields.push(`${fd.name}: ${tsType}`)
            }
        }
        else if (fd.type.syntaxType === SyntaxType.Identifier) {
            let t = fd.type.value
            let ip = ""
            Object.keys(imports).some(i => {
                if (t.startsWith(i)) {
                    ip = i;
                    return true
                }
            })
            let iTpe: PIdentifierType = null as any
            let publicI: string | undefined = undefined
            if (ip.length) { // imported identifier
                let [type, newP] = isIdentifierMessageOrEnum(typesTracking, fd.type.resolvedValue!, imports[ip])
                iTpe = type
                publicI = newP
                // t = t.replace(ip, ip.split(".").join("_"))
            } else {
                typesTracking[file].types.some(t => {
                    if (t.name === (fd.type as any).resolvedValue || t.name === fd.type.value) {
                        iTpe = t.type
                        return true
                    }
                })
            }
            let isOptional = iTpe === PIdentifierType.MESSAGE ? true : false
            if (ip.length) {
                if (publicI) {
                    const is = publicI.split("/")
                    const iname = is.slice(0, -1).join("_")
                    publicImports.push(`import ${iname} from "./${is.join("/").replace(".proto", "")}" `)
                    t = t.replace(ip, iname)
                } else {
                    t = t.replace(ip, ip.split(".").join("_"))
                }
            } else {
                t = getTSTypeNameFromFullName(fd.type.resolvedValue!, packageName)
            }
            if (fd.repeated) {
                t = `${t}[]`
            }
            fields.push(`${fd.name} ${isOptional ? "?" : ""}:${t}`)
        }
    })

    console.log("fields", fields);
    if (md.oneofs) {
        Object.entries(md.oneofs).forEach(([key, value]) => {
            fields.push(`${key} ?: ${value.oneof.map(o => `"${o}"`).join(" | ")}`)
        })
    }
    const output = `{ ${fields.join(", ")} }`
    console.log("output : ", output);
    return output
}
/**
 *  PUSH_TO_FIELD_WITH_EMPTYARG = obj.arrayF.push(pbf.replaceWithMethodName())
 *  VALUE_ARG :  pbf.replaceWithMethodName(obj.field)
 *  VALUE_AND_TRUE_ARG : pbf.replaceWithMethodName(obj.field, true);
 *  PUSH_TO_FIELD_WITH_OBJECT_READ_VARIANT  :obj.phones.push(Person.PhoneNumber.read(pbf, pbf.readVarint() + pbf.pos));
 *  TRUE_ARG : pbf.rpelaceWithMethodName(true);
 *  PBF_ARG_READVARIANT_POS:  replaceWithMethodName(pbf, pbf.readVarint() + pbf.pos);
 *  MAP_READ : { entry = Person._FieldEntry35.read(pbf, pbf.readVarint() + pbf.pos); obj.mapenums[entry.key] = entry.value; }
 */
type ReadMethod = {
    name: string,
    callType: "EMPTY_ARGS"
    | "VALUE_ARG" |
    "PUSH_TO_FIELD_WITH_EMPTYARG"
    | "PUSH_TO_FIELD_WITH_OBJECT_READ_VARIANT"
    | "VALUE_AND_TRUE_ARG"
    | "TRUE_ARG" |
    "PBF_ARG_READVARIANT_POS"
    | "MAP_READ"
}

/**
 *  FOR_LOOP_OVERFIELD_CALL_METHOD_WITH_INDEX_VALUE : for (i = 0; i < obj.rstringf.length; i++) pbf.writeStringField(20, obj.rstringf[i]);
 *  VALUE_ARG : pbf.replaceWithMethodName(id, obj.field);
 * FOR_LOOP_OVERFIELD_CALL_METHOD_WITH_OBJECT_WRITE_AND_INDEX_VALUE:  for (i = 0; i < obj.phones.length; i++) pbf.writeMessage(4, Person.PhoneNumber.write, obj.phones[i]);
 * OBJECTWRITE_METHOD_FIELD_VALUE: pbf.writeMessage(3, Person.PhoneNumber.PhoneNumber2.write, obj.number2);
 */
type WriteMethod = {
    name: string,
    callType: "VALUE_ARG" |
    "FOR_LOOP_OVERFIELD_CALL_METHOD_WITH_INDEX_VALUE"
    | "FOR_LOOP_OVERFIELD_CALL_METHOD_WITH_OBJECT_WRITE_AND_INDEX_VALUE"
    | "MAP_WRITE"
    | "OBJECTWRITE_METHOD_FIELD_VALUE",
    objWriteFn?: string
}

const getReadWriteMethodForBasicType = (ft: protoParser.BaseType, repeated: boolean): [ReadMethod, WriteMethod, any] => {
    let readMethod: ReadMethod = null as any
    let writeMethod: WriteMethod = null as any
    let defaultValue: any = null as any
    if (repeated) {
        defaultValue = []
    }
    switch (ft.value) {
        case "bool": {
            if (repeated) {
                readMethod = { name: "readPackedBoolean", callType: "VALUE_ARG" }
                writeMethod = { name: "writePackedBoolean", callType: "VALUE_ARG" }
            } else {
                readMethod = { name: "readBoolean", callType: "EMPTY_ARGS" }
                writeMethod = { name: "writeBooleanField", callType: "VALUE_ARG" }
                defaultValue = false
            }

            break
        }
        case "string": {
            if (repeated) {
                readMethod = { name: "readString", callType: "PUSH_TO_FIELD_WITH_EMPTYARG" }
                writeMethod = { name: "writeStringField", callType: "FOR_LOOP_OVERFIELD_CALL_METHOD_WITH_INDEX_VALUE" }
            } else {
                readMethod = { name: "readString", callType: "EMPTY_ARGS" }
                writeMethod = { name: "writeStringField", callType: "VALUE_ARG" }
                defaultValue = `""`
            }

            break
        }
        case "bytes": {
            if (repeated) {
                readMethod = { name: "readBytes", callType: "PUSH_TO_FIELD_WITH_EMPTYARG" }
                writeMethod = { name: "writeBytesField", callType: "FOR_LOOP_OVERFIELD_CALL_METHOD_WITH_INDEX_VALUE" }
            } else {
                readMethod = { name: "readBytes", callType: "EMPTY_ARGS" }
                writeMethod = { name: "writeBytesField", callType: "VALUE_ARG" }
                defaultValue = null
            }

            break
        }
        case "double": {
            if (repeated) {
                readMethod = { name: "readPackedDouble", callType: "VALUE_ARG" }
                writeMethod = { name: "writePackedDouble", callType: "VALUE_ARG" }
            } else {
                readMethod = { name: "readDouble", callType: "EMPTY_ARGS" }
                writeMethod = { name: "writeDoubleField", callType: "VALUE_ARG" }
                defaultValue = 0
            }

            break
        }
        case "fixed32": {
            if (repeated) {
                readMethod = { name: "readPackedFixed32", callType: "VALUE_ARG" }
                writeMethod = { name: "writePackedFixed32", callType: "VALUE_ARG" }
            } else {
                readMethod = { name: "readFixed32", callType: "EMPTY_ARGS" }
                writeMethod = { name: "writeFixed32Field", callType: "VALUE_ARG" }
                defaultValue = 0
            }

            break
        }
        case "fixed64": {
            if (repeated) {
                readMethod = { name: "readSFixed64", callType: "PUSH_TO_FIELD_WITH_EMPTYARG" }
                writeMethod = { name: "writePackedFixed64", callType: "VALUE_ARG" }
            } else {
                readMethod = { name: "readFixed64", callType: "EMPTY_ARGS" }
                writeMethod = { name: "writeFixed64Field", callType: "VALUE_ARG" }
                defaultValue = 0
            }
            break
        }
        case "float": {
            if (repeated) {
                readMethod = { name: "readPackedFloat", callType: "VALUE_ARG" }
                writeMethod = { name: "writePackedFloat", callType: "VALUE_ARG" }
            } else {
                readMethod = { name: "readFloat", callType: "EMPTY_ARGS" }
                writeMethod = { name: "writeFloatField", callType: "VALUE_ARG" }
                defaultValue = 0
            }
            break
        }
        case "int32":
        case "int64":
            {
                if (repeated) {
                    readMethod = { name: "readPackedVarint", callType: "VALUE_AND_TRUE_ARG" }
                    writeMethod = { name: "writePackedVarint", callType: "VALUE_ARG" }
                } else {
                    readMethod = { name: "readVarint", callType: "TRUE_ARG" }
                    writeMethod = { name: "writeVarintField", callType: "VALUE_ARG" }
                    defaultValue = 0
                }
                break
            }
        case "sfixed32": {
            if (repeated) {
                readMethod = { name: "readPackedFixed32", callType: "VALUE_ARG" }
                writeMethod = { name: "writePackedFixed32", callType: "VALUE_ARG" }
            } else {
                readMethod = { name: "readSFixed32", callType: "EMPTY_ARGS" }
                writeMethod = { name: "writeFixed32Field", callType: "VALUE_ARG" }
                defaultValue = 0
            }
            break
        }
        case "sfixed64": {
            if (repeated) {
                readMethod = { name: "readSFixed64", callType: "PUSH_TO_FIELD_WITH_EMPTYARG" }
                writeMethod = { name: "writePackedFixed64", callType: "VALUE_ARG" }
            } else {
                readMethod = { name: "readFixed64", callType: "EMPTY_ARGS" }
                writeMethod = { name: "writeSFixed64Field", callType: "VALUE_ARG" }
                defaultValue = 0
            }
            break
        }
        case "sint32":
        case "sint64":

            {
                if (repeated) {
                    readMethod = { name: "readPackedSVarint", callType: "VALUE_ARG" }
                    writeMethod = { name: "writePackedSVarint", callType: "VALUE_ARG" }
                } else {
                    readMethod = { name: "readSVarint", callType: "EMPTY_ARGS" }
                    writeMethod = { name: "writeSVarintField", callType: "VALUE_ARG" }
                    defaultValue = 0
                }
                break
            }
        case "uint32":
        case "uint64": {
            if (repeated) {
                readMethod = { name: "readPackedVarint", callType: "VALUE_ARG" }
                writeMethod = { name: "writePackedVarint", callType: "VALUE_ARG" }
            } else {
                readMethod = { name: "readVarint", callType: "EMPTY_ARGS" }
                writeMethod = { name: "writeVarintField", callType: "VALUE_ARG" }
                defaultValue = 0
            }
            break
        }

    }
    return [readMethod, writeMethod, defaultValue];
}


const enum PIdentifierType {
    MESSAGE = "Message",
    ENUM = "Enum"
}

const isIdentifierMessageOrEnum = (typeTracking: GenerateProtoFileInput["typesConfig"]["typesTracking"],
    resolvedValue: string, file: string): [PIdentifierType, string | undefined] => {
    let result: [PIdentifierType, string | undefined] = null as any
    typeTracking[file].types.some(t => {
        if (t.name === resolvedValue) {
            result = [t.type, undefined]
            return true
        }
    })
    if (!result) { // imported from public import
        const imports = typeTracking[file].imports.filter(i => i.public)
        imports.some(i => {
            const br = typeTracking[i.name].types.some(t => {
                if (t.name === resolvedValue) {
                    // const is = i.name.split("/")
                    // const ns = is.slice(0, -1).join("_")
                    result = [t.type, i.name]
                    return true
                }
            })
            if (br) {
                return true
            }
        })

    }
    console.log("isDentifier result : ", result);
    return result;
}

const getReadWriteMethodsForIdentifier = (input: {
    identifier: protoParser.Identifier,
    imports: Record<string, string>,
    typeTracking: GenerateProtoFileInput["typesConfig"]["typesTracking"]
    file: string,
    parentClassName: string,
    repeated: boolean,
}): [ReadMethod, WriteMethod, any] => {
    console.log("getReadWriteMethodsForIdentifier", input);
    const { identifier, imports, typeTracking, parentClassName, repeated, file } = input
    let readMethod: ReadMethod = null as any
    let writeMethod: WriteMethod = null as any
    let defaultValue: any = undefined
    let t = identifier.value
    let ip = ""
    const packageName = typeTracking[file].package
    Object.keys(imports).some(i => {
        if (t.startsWith(i)) {
            ip = i;
            return true
        }
    })
    let protoIType: PIdentifierType = null as any;
    let publicI: string | undefined = undefined;
    if (ip.length) { // imported identifier
        let [type, newP] = isIdentifierMessageOrEnum(typeTracking, identifier.resolvedValue!, imports[ip])
        protoIType = type
        publicI = newP
    } else {
        typeTracking[file].types.some(t => {
            console.log("type : ", t);

            if (t.name === identifier.resolvedValue || t.name === identifier.value) {
                protoIType = t.type

                return true
            }
        })
    }

    if (protoIType === PIdentifierType.ENUM) {
        defaultValue = 0
        if (repeated) {
            defaultValue = "[]"
            readMethod = { name: "readPackedVarint", callType: "VALUE_ARG" }
            writeMethod = { name: "writePackedVarint", callType: "VALUE_ARG" }
        } else {
            readMethod = { name: "readVarint", callType: "EMPTY_ARGS" }
            writeMethod = { name: "writeVarintField", callType: "VALUE_ARG" }
        }
    } else {
        defaultValue = "undefined"
        if (ip) {
            if (publicI) {
                const v = publicI.split("/").slice(0, -1).join("_")
                t = t.replace(ip, v)
            } else {
                t = t.replace(ip, ip.split(".").join("_"))
            }
        } else {
            const rv = identifier.resolvedValue!.split(".")
            t = packageName ? `${parentClassName}.${rv.slice(2).join(".")}` : `${parentClassName}.${rv.slice(1).join(".")}`
        }

        if (repeated) {
            defaultValue = "[]"
            readMethod = { name: `${t}._read`, callType: "PUSH_TO_FIELD_WITH_OBJECT_READ_VARIANT" }
            writeMethod = { name: "writeMessage", callType: "FOR_LOOP_OVERFIELD_CALL_METHOD_WITH_OBJECT_WRITE_AND_INDEX_VALUE", objWriteFn: `${t}._write` }
        } else {
            readMethod = { name: `${t}._read`, callType: "PBF_ARG_READVARIANT_POS" }
            writeMethod = { name: "writeMessage", callType: "OBJECTWRITE_METHOD_FIELD_VALUE", objWriteFn: `${t}._write` }
        }

    }

    return [readMethod, writeMethod, defaultValue]
}

const convertReadMethodToPBFCall = (rm: ReadMethod, objectKey: string): string => {
    let result = ""
    if (rm.callType === "EMPTY_ARGS") {
        result = `obj.${objectKey} = pbf.${rm.name}()`
    } else if (rm.callType === "VALUE_ARG") {
        result = `pbf.${rm.name}(obj.${objectKey})`
    } else if (rm.callType === "TRUE_ARG") {
        result = `obj.${objectKey} = pbf.${rm.name}(true)`
    } else if (rm.callType === "PBF_ARG_READVARIANT_POS") {
        result = `obj.${objectKey} = ${rm.name}(pbf, pbf.readVarint() + pbf.pos)`
    } else if (rm.callType === "PUSH_TO_FIELD_WITH_EMPTYARG") {
        result = `obj.${objectKey}.push(pbf.${rm.name}())`
    } else if (rm.callType === "PUSH_TO_FIELD_WITH_OBJECT_READ_VARIANT") {
        result = `obj.${objectKey}.push(${rm.name}(pbf, pbf.readVarint() + pbf.pos));`
    } else if (rm.callType === "VALUE_AND_TRUE_ARG") {
        result = `pbf.${rm.name}(obj.${objectKey}, true)`
    } else if (rm.callType === "MAP_READ") {
        result = `const entry = ${rm.name}(pbf, pbf.readVarint() + pbf.pos); 
                 obj.${objectKey}[entry.key] = entry.value;`
    }
    return result;
}

const convertWriteMethodToPBFCall = (wm: WriteMethod, id: number, objKey: string) => {
    let result = ""
    if (wm.callType === "VALUE_ARG") {
        result = `pbf.${wm.name}(${id}, obj.${objKey})`
    } else if (wm.callType === "FOR_LOOP_OVERFIELD_CALL_METHOD_WITH_INDEX_VALUE") {
        result = `for (let i = 0; i < obj.${objKey}.length; i++) pbf.${wm.name}(${id}, obj.${objKey}[i]);`
    } else if (wm.callType === "FOR_LOOP_OVERFIELD_CALL_METHOD_WITH_OBJECT_WRITE_AND_INDEX_VALUE") {
        result = `for (let i = 0; i < obj.${objKey}.length; i++) pbf.writeMessage(${id}, ${wm.objWriteFn}, obj.${objKey}[i]);`
    } else if (wm.callType === "OBJECTWRITE_METHOD_FIELD_VALUE") {
        result = `pbf.writeMessage(${id}, ${wm.objWriteFn}, obj.${objKey});`
    } else if (wm.callType === "MAP_WRITE") {
        result = `for (let i in obj.${objKey}) if (Object.prototype.hasOwnProperty.call(obj.${objKey}, i)) pbf.writeMessage(35, ${wm.name}, { key: i, value: obj.${objKey}[i] });`
    }
    return result;
}

const generateSerliazeClassForMap = (input: {
    fd: protoParser.FieldDefinition,
    file: string,
    parentClassName: string,
    typeTracking: GenerateProtoFileInput["typesConfig"]["typesTracking"],
    imports: Record<string, string>
}) => {
    const { fd, file, typeTracking, imports, parentClassName } = input;

    const [kr, kw, kd] = getReadWriteMethodForBasicType(fd.keyType! as any, false)
    let vr: ReadMethod = null as any
    let vw: WriteMethod = null as any
    let vd: any = null
    if (fd.type.syntaxType === SyntaxType.BaseType) {
        const r = getReadWriteMethodForBasicType(fd.type, false)
        vr = r[0]
        vw = r[1]
        vd = r[2]
    } else if (fd.type.syntaxType === SyntaxType.Identifier) {
        const ir = getReadWriteMethodsForIdentifier({
            file, identifier: fd.type, imports,
            repeated: false, typeTracking, parentClassName
        })
        vr = ir[0]
        vw = ir[1]
        vd = ir[2]

    }
    const output = `class {
         
         static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 1) ${convertReadMethodToPBFCall(kr, "key")};
            else if (tag === 2) ${convertReadMethodToPBFCall(vr, "value")};
         }

         static read(pbf:any,end:any) {
             return pbf.readFields(this._readField, {key: ${kd}, value: ${vd}},end)
         }

         static write(obj:any,pbf:any) {
            if (obj.key) ${convertWriteMethodToPBFCall(kw, 1, "key")}
            if (obj.value) ${convertWriteMethodToPBFCall(vw, 2, "value")}
         }

     }`

    return output;
}

const getTSTypeNameFromFullName = (fullName: string, packageName?: string) => {
    const fs = fullName.split(".")
    return packageName ? fs.slice(2).join("_") : fs.slice(1).join("_")
}


const convertMessageDefToSerializeDeserializeClass = (input: {

    md: protoParser.MessageDefinition,
    typesTracking: GenerateProtoFileInput["typesConfig"]["typesTracking"],
    imports: Record<string, string>,
    file: string,
    parentClassName: string
    typesImportName: string,
}) => {
    console.log("convertMessageDefToSerializeDeserialize", input);
    const { md, file, typesImportName, imports, typesTracking, parentClassName } = input
    console.log("**** getting class for ", md.name, md.fullName);
    if (md.name === "PhoneNumber") {
        console.log("****** phone number class");
    }
    const fields: {
        name: string, id: number,
        readMethod: ReadMethod, writeMethod: WriteMethod, defaultValue: any
    }[] = []
    const statics: { name: string, value: string }[] = []
    const packageName = typesTracking[file].package
    let objectTypeName = `${typesImportName}.${getTSTypeNameFromFullName(md.fullName!, packageName)}`
    // console.log("fields :", md.fields);
    let nested: NestedType = (md as any).nested
    if (nested) {
        Object.entries(nested).forEach(([key, value]) => {
            if (value.syntaxType === SyntaxType.MessageDefinition) {
                const code = convertMessageDefToSerializeDeserializeClass({ md: value as any, parentClassName, file, imports, typesTracking, typesImportName })
                statics.push({ name: value.name, value: code })
            }
        })
    }
    Object.entries(md.fields).forEach(([key, fd]) => {
        console.log("field: ", fd);
        if (fd.type.syntaxType === SyntaxType.BaseType) {
            if (fd.map) {
                const sfName = `_FieldEntry${fd.id}`
                fields.push({
                    name: fd.name,
                    writeMethod: { name: `${md.name}.${sfName}.write`, callType: "MAP_WRITE" },
                    readMethod: { name: `${md.name}.${sfName}.read`, callType: "MAP_READ" },
                    defaultValue: "{}",
                    id: fd.id,
                })
                const code = generateSerliazeClassForMap({ file, fd, imports, typeTracking: typesTracking, parentClassName })
                statics.push({ name: sfName, value: code })
            } else {
                let [rm, wm, dv] = getReadWriteMethodForBasicType(fd.type, fd.repeated)
                console.log("base type read write", rm, wm);
                fields.push({ name: fd.name, id: fd.id, readMethod: rm, writeMethod: wm, defaultValue: dv })
            }
        }
        else if (fd.type.syntaxType === SyntaxType.Identifier) { // nested field 
            const [rm, wm, dv] = getReadWriteMethodsForIdentifier({ identifier: fd.type, file, imports, parentClassName, repeated: fd.repeated, typeTracking: typesTracking })
            fields.push({ name: fd.name, id: fd.id, readMethod: rm, writeMethod: wm, defaultValue: dv })
        }
    })

    const getOneOfString = (fieldName: string): string => {
        let result: string | undefined = ""
        if (md.oneofs) {
            Object.entries(md.oneofs).some(([key, value]) => {
                if (value.oneof.includes(fieldName)) {
                    result = `obj.${key} = "${fieldName}"`
                    return true;
                }
            })
        }
        return result ? result : ""
    }
    console.log("fields : ", fields);

    const readFileCode = () => {
        return `private static _readField(tag:number,obj:any,pbf:any) {
            ${fields.map((f, i) => {
            const v = `(tag === ${f.id}) {
                    ${convertReadMethodToPBFCall(f.readMethod, f.name)}
                    ${getOneOfString(f.name)}   
                }`
            if (i === 0) {
                return `if ${v}`
            } else {
                return `else if ${v}`
            }
        }).join("\n")}
         }`
    }
    console.log("readFile Code :", readFileCode());
    console.log("objname :", objectTypeName);
    //TODO do we need to specify oneof values in defaults ?
    const output = `class ${md.name} {
         ${statics.map(s => {
        return `static ${s.name} = ${s.value}`
    }).join("\n")}

         ${readFileCode()}
         static _read(pbf:any,end?:any):${objectTypeName} {
            return pbf.readFields(this._readField, {${fields.map(f => `${f.name}:${f.defaultValue}`).join(",")}}, end) as any;
         }

         static deserialize(buffer:Uint8Array):${objectTypeName} {
             const pbf = new Pbf(buffer)
             return this._read(pbf)
         }
          
         static serialize(obj:${objectTypeName}) {
             const pbf = new Pbf()
             this._write(obj,pbf)
             return pbf.finish()
         }


         static _write(obj:${objectTypeName},pbf:any) {
             ${fields.map(f => {
        return `if (obj.${f.name}) ${convertWriteMethodToPBFCall(f.writeMethod, f.id, f.name)};`
    }).join("\n")}
         }
      }
    `
    return output
}

const convertServiceMethodToGrpCRequest = ({ md, baseUrl, serviceName, packageName }: {
    md: protoParser.MethodDefinition,
    packageName: string, baseUrl: string, serviceName: string
}): string => {
    const i = md.requestType.value
    const o = md.responseType.value
    const url = `${baseUrl}/${packageName}.${serviceName}/${md.name}`
    let grpcMethodType = (md as any).responseStream ? "GRPCUnary" : "GRPCResponseStream"
    return `export  type ${pascal(md.name)}<S extends GRPCSerializer<${i}>,DS extends GRPCDeSerializer<${o}>,T extends Transform<${o},any> | null = null> = ${grpcMethodType}<"${url}",${i},${o},S,DS,T>`
}


const convertServiceMethodToGrpCRequestCreator = ({ md, apiName, baseUrl, serviceName, packageName }: {
    md: protoParser.MethodDefinition,
    apiName: string,
    packageName: string, baseUrl: string, serviceName: string
}): string => {
    const url = `${baseUrl}/${packageName}.${serviceName}/${md.name}`
    const responseStream = (md as any).responseStream
    let rc = ""
    const typesImpotsPath = `${apiName}_types`
    const req = `${typesImpotsPath}.${md.requestType.value}`
    const resp = `${typesImpotsPath}.${md.responseType.value}`
    const name = `create${md.name}Request`
    const paramsList = [
        { name: "req", optional: false, type: resp },
        { name: "abortable", type: "boolean", optional: true }, { name: "offline", type: "boolean", optional: true }]
    if (!responseStream) {
        paramsList.push({ name: "optimisticResponse", optional: true, type: resp })
    }
    const params = ` {${paramsList.map(p => p.name).join(", ")}}:{${paramsList.map(p => `${p.name} ${p.optional ? "?" : ""}:${p.type}`).join(", ")}}`
    if (responseStream) {
        rc = `
         static ${name}(${params}) {
              return { type: FetchVariants.POST,url: {path:"${url}"} ,body:req,optimisticResponse,_abortable:abortable,offline}
          }
        `
    } else {
        rc = `
         static ${name}(${params}) {
              return {type: FetchVariants.POST, url: {path:"${url}"} ,body:req, optimisticResponse,_abortable:abortable,offline}
          }
        `
    }
    return rc;
}

type GenerateProtoFileInput = {
    file: string,
    typesConfig: {
        baseInputPath: string,
        baseOutputPath: string,
        typesTracking: Record<string, {
            imports: { name: string, public?: boolean }[],
            package?: string
            types:
            { name: string, fromPublicImport?: boolean, type: PIdentifierType }[]
        }>
    }
    serializersConfig: {
        baseInputPath: string, baseOutputPath: string,
        serializersTracking: Record<string, {
            types:
            { name: string, fromPublicImport?: boolean, type: "Enum" | "Message" }[]
        }>
    },
    url: string, root?: boolean, apiName: string
}

/**
 * 
 * @param input 
 */
const generateTypesForProtoFile = (input: GenerateProtoFileInput) => {
    console.log("generateTypesForProtoFile", input);
    let { file, url, typesConfig, serializersConfig, root, apiName, } = input
    const source = FileUtils.readFileSync(file)
    const ast = protoParser.parse(source)
    if (ast.syntaxType === SyntaxType.ProtoError) {
        throw new Error(`Error parsing protofile ${ast.message}`)
    }
    console.log("ast", ast);
    ast.imports?.forEach(i => {
        if (!typesConfig.typesTracking[i.path]) {
            generateTypesForProtoFile({
                file: i.path, typesConfig, serializersConfig,
                root: false, apiName, url
            })
        }
    })
    typesConfig.typesTracking[file] = { imports: [], package: ast.package, types: [] }
    const enums: Record<string, string> = {}
    const typesResults: string[] = []
    const serializationResults: string[] = []
    const typesPublicImports: string[] = []
    const typesImports: string[] = []
    const dottedImports: Record<string, string> = {}
    const requestCreators: string[] = []
    const protoRoot = ast.root.nested
    console.log("protoRoot : ", protoRoot);
    if (!protoRoot) {
        return
    }
    let typesOutputPath = ""
    let serializersOutputPath = ""
    let serializersTypesImportName = ""
    const serializersImports: string[] = []
    let nameSpaceName = apiName
    if (root) {
        typesOutputPath = ConfigUtils.getGrpcApiOutputFilePathForTypes(apiName)
        serializersOutputPath = ConfigUtils.getGrpcOutputFilePathForSerializersTypes(apiName)
        serializersTypesImportName = `${apiName}_types`
        const rp = relative(serializersOutputPath, typesOutputPath).split(sep).slice(1, -1).join("/")
        serializersImports.push(`import ${serializersTypesImportName} from "${rp}"`)
        // serializersTypesPath = 
    } else {
        const fs = file.split("/")
        nameSpaceName = fs[fs.length - 1].replace(".proto", "")
        typesOutputPath = join(typesConfig.baseOutputPath, file.split("/").join(sep).replace(".proto", ".ts"))
        serializersOutputPath = join(serializersConfig.baseOutputPath, file.split("/").join(sep).replace(".proto", ".ts"))
        serializersTypesImportName = `${file.split("/").slice(0, -1).join("_")}_types`
        const rp = relative(serializersOutputPath, typesOutputPath).split(sep).slice(1).join("/").replace(".ts", "")
        serializersImports.push(`import ${serializersTypesImportName} from "${rp}"`)
    }
    const serializersClassName = `${pascal(nameSpaceName)}Serializers`
    serializersImports.push(`
     //@ts-ignore 
     import * as pbf from "pbf"
    `)

    ast.imports?.forEach(i => {
        typesConfig.typesTracking[file].imports.push({ name: i.path, public: i.public })
        const is = i.path.split("/")
        const ns = is.slice(0, -1).join("_")
        if (!root) {
            typesImports.push(`import ${ns} from "./${is.slice(1).join("/").replace(".proto", "")}" `)
        } else {
            typesImports.push(`import ${ns} from "./${is.join("/").replace(".proto", "")}" `)
        }

        dottedImports[(is.slice(0, -1).join("."))] = i.path
    })

    let rn: NestedType = protoRoot
    if (ast.package) {
        rn = Object.entries(protoRoot)[0][1].nested!
    }
    let isServiceExist = false

    console.log("rn", rn);
    Object.entries(rn).forEach(([key, value]) => {
        console.log("key", key, "kind", value.syntaxType);
        if (value.syntaxType === SyntaxType.EnumDefinition) {
            const [e, n] = convertEnumDefToTSEnum(value as any, ast.package)
            typesConfig.typesTracking[file].types.push({ name: value.fullName || value.name, type: PIdentifierType.ENUM })
            typesResults.push(e)
        } else if (value.syntaxType === SyntaxType.MessageDefinition) {
            isServiceExist = true
            const mt = convertMessageDefToTSType({ md: value as any, enums, typesTracking: typesConfig.typesTracking, file, imports: dottedImports, publicImports: typesPublicImports })
            typesResults.push(`export type ${value.name} = ${mt}`)
            const sr = convertMessageDefToSerializeDeserializeClass({
                md: value as any, typesTracking: typesConfig.typesTracking,
                parentClassName: serializersClassName,
                file, imports: dottedImports, typesImportName: serializersTypesImportName
            })
            serializationResults.push(`static ${value.name} = ${sr}`)
        } else if (value.syntaxType === SyntaxType.ServiceDefinition) {
            const sd = value as protoParser.ServiceDefinition
            const sr: string[] = []
            const rcr: string[] = []
            Object.entries(sd.methods).forEach(([key, value]) => {
                if (root) {
                    rcr.push(convertServiceMethodToGrpCRequestCreator({ md: value, apiName, baseUrl: url, serviceName: sd.name, packageName: ast.package! }))
                }
                sr.push(convertServiceMethodToGrpCRequest({ md: value, baseUrl: url, serviceName: sd.name, packageName: ast.package! }))
            })
            const sc = `
              export namespace ${sd.name} {
                   ${sr.join("\n")}
               }
            `
            typesResults.push(sc)
            if (root) {
                const rc = `
                  static ${pascal(sd.name)} = class {
                      ${rcr.join("\n")}
                  }
                `
                requestCreators.push(rc)
            }
        }
    })

    // console.log("enums ", enums);
    typesResults.push(...Object.values(enums))

    // return results;

    if (!root) {

    }

    if (isServiceExist) {
        typesImports.push(`import { GRPCSerializer,GRPCDeSerializer, GRPCUnary,GRPCResponseStream,Transform} from "@typesafe-store/store"`)
    }

    typesImports.push(...[...new Set(typesPublicImports)])
    const typesOutputCode = `
    
    ${typesImports.join("\n")}
     
    namespace ${nameSpaceName} {
        ${typesResults.join("\n")}
    }
    export default ${nameSpaceName}
  `
    FileUtils.writeFileSync(typesOutputPath, typesOutputCode)

    // serlizares write
    serializersImports.push(`
      //@ts-ignore
      import Pbf from "pbf"
    `)
    const serliazersOutputCode = `
      ${[...typesImports, ...serializersImports].join("\n")}

      class ${serializersClassName} {
          ${serializationResults.join("\n")}
      } 
      export default ${serializersClassName}
    `
    FileUtils.writeFileSync(serializersOutputPath, serliazersOutputCode)
    if (root) { // request creators file 
        const clsName = `${pascal(nameSpaceName)}RequestCreators`
        const rcOutPut = `
        import ${apiName}_types from "../types"
        import { FetchVariants} from "@typesafe-store/store"
        
        class ${clsName} {
            ${requestCreators.join("\n")}
        }
        export default ${clsName}
      `
        const rcFile = ConfigUtils.getGrpcApiOutputFilePathForRequestCreators(apiName)
        FileUtils.writeFileSync(rcFile, rcOutPut)
    }

}


export const generateGrpcTypes = async (apis: GrpcApiConfig[]): Promise<[boolean, string]> => {
    let result: [boolean, string] = [true, ""]

    await Promise.all(apis.map(async (grpcApi) => {
        if (!existsSync(grpcApi.proto) || !grpcApi.proto.endsWith(".proto")) {
            throw new Error(`You should provide a valid proto file path for api :  ${grpcApi.name} `)
        }
        const source = FileUtils.readFileSync(grpcApi.proto)
        const ast = protoParser.parse(source)
        console.log("ast", ast);
        if (ast.syntaxType === SyntaxType.ProtoError) {
            throw new Error(`Error parsing protofile ${ast.message}`)
        }
        FileUtils.writeFileSync("./ast.json", JSON.stringify(ast, null, 2))

        generateTypesForProtoFile({
            file: grpcApi.proto,
            typesConfig: {
                baseOutputPath: ConfigUtils.getGrpcApiOutputFolderForTypes(grpcApi.name),
                baseInputPath: dirname(resolve(grpcApi.proto)),
                typesTracking: {}
            },
            serializersConfig: {
                baseOutputPath: ConfigUtils.getGrpcOutputFolderForSerializersTypes(grpcApi.name),
                baseInputPath: dirname(resolve(grpcApi.proto)),
                serializersTracking: {}
            },
            apiName: grpcApi.name,
            url: grpcApi.url,
            root: true,
        })
        // const messages = getMessages(ast.root.nested!)
        // console.log("messages ", messages);
        // const types = messages.map(convertMessageDefToTSType)


    }))


    return result
}