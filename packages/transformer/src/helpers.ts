import * as ts from "typescript";
import * as fs from "fs";
import { LocalPropertyDecls, EAccess, MetaType, ProcessThisResult, MetaValue, Meta, ReducersMeta, AsyncTypes, TypeSafeStoreConfig, TypeSafeStoreConfigExtra, HttpUrlConfig } from "./types";
import { T_STORE_ASYNC_TYPE, REDUCERS_FOLDER, GENERATED_FOLDER, STORE_TYPES_FOLDER, REST_API_TYPES_FOLDER, GRAPHQL_API_TYPES_FOLDER, GEN_SUFFIX, GRAPHQL_QUERIES_FOLDER } from "./constants";
import { resolve, join, dirname, sep } from "path";


let wcp: ts.WatchOfConfigFile<ts.SemanticDiagnosticsBuilderProgram> = null as any;

let program: ts.Program = null as any;

let typeChecker: ts.TypeChecker = null as any;

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

let storePath: string = null as any

let config: TypeSafeStoreConfigExtra = null as any


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

// export function getRestApisPath() {
//   return join(getStoreTypesPath(), REST_API_TYPES_FOLDER)
// }

export function setTypeSafeStoreConfig(c: TypeSafeStoreConfig) {
  config = {
    ...c, reducersPath: "", reducersGeneratedPath: "",
    typesPath: "",
    restApiTypesPath: "",
    graphqlApiTypesPath: "",
    graphqlQueriesPath: ""
  };
  config.storePath = resolve(config.storePath)
  config.reducersPath = join(config.storePath, REDUCERS_FOLDER)

  config.reducersGeneratedPath = join(config.reducersPath, GENERATED_FOLDER)

  config.typesPath = join(config.storePath, STORE_TYPES_FOLDER)

  config.restApiTypesPath = join(config.typesPath, REST_API_TYPES_FOLDER)

  config.graphqlApiTypesPath = join(config.typesPath, GRAPHQL_API_TYPES_FOLDER)

  config.graphqlQueriesPath = join(config.storePath, GRAPHQL_QUERIES_FOLDER)

}

export function getTypeSafeStoreConfig() {
  return config;
}

export function setProgram(p: ts.Program) {
  program = p;
}
export function getProgram() {
  return program;
}

export function setClassDeclaration(cd: ts.ClassDeclaration) {
  // console.log("setting class declaration : ", cd.members);
  classDecl = cd;
  typeChecker = getProgram().getTypeChecker();
  const type = typeChecker.getTypeAtLocation(cd);
  members = cd.members;
  memberTypes = getMembersOfType(type);
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
  const group = `${getPrefixPathForReducerGroup(currentProcessingReducerFile)}${getTypeName()}`;
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
  const group = `${getPrefixPathForReducerGroup(currentProcessingReducerFile)}${getTypeName()}`;
  const generalMethods = methods.map(m => {
    const n = m.name.getText();
    const pl = m.parameters.length;
    if (pl === 0) {
      return `{name :"${n}",group:"${group}"}`;
    }
    const t = typeChecker.typeToString(
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

export function isMethod(input: ts.Symbol) {
  return ts.isMethodDeclaration(input.declarations[0]);
}

export function getMembersofTypeNode(
  type: ts.TypeNode,
  typeChecker: ts.TypeChecker
) {
  return typeChecker.getPropertiesOfType(typeChecker.getTypeFromTypeNode(type));
}

export function getMembersOfType(type: ts.Type, symbol?: ts.Symbol) {
  return typeChecker.getPropertiesOfType(type).map(s => {
    return {
      type: typeChecker.getNonNullableType(
        typeChecker.getTypeOfSymbolAtLocation(s, classDecl)
      ),
      name: s.escapedName.toString()
    };
  });
}

function isTypeReference(type: ts.Type): type is ts.TypeReference {
  return !!(
    type.getFlags() & ts.TypeFlags.Object &&
    (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference
  );
}

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
    if (isArrayType(t)) {
      // console.log("**** ok its array type : ", input[0]);
      if (isTypeReference(t)) {
        // console.log("its reference type");
        t = t.typeArguments![0];
      } else {
        t = (t as any).elementType;
        // console.log("its regular array type :", t);
      }
    }
    return getTypeForPropertyAccess(input.slice(1), getMembersOfType(t));
  }
}

export function isArrayType(input: ts.Type) {
  // console.log("Checking array for type2 : ", input.flags, "toString : ", typeChecker.typeToString(input),
  // "Node :");
  // const s = input.symbol.valueDeclaration
  return ts.isArrayTypeNode(typeChecker.typeToTypeNode(input)!);
}

export function isArrayPropAccess(input: string) {
  // console.log("**** isArrayPropAccess", input);
  const result = isArrayType(getTypeForPropertyAccess(input.split(".")));
  // console.log("**** isArrayPropAccess result : ", result);
  return result;
}

function getTypeFromPropAccess(input: string): MetaType {
  const t = getTypeForPropertyAccess(input.split("."));
  const ts1 = typeChecker.typeToString(t);
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
  const ts1 = typeChecker.typeToString(t);
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
    const typeStr = typeChecker.typeToString(
      type,
      undefined,
      ts.TypeFormatFlags.NoTruncation
    );
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
  if (isTypeReference(t)) {
  } else {
    const s = typeChecker.typeToString(t);
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


export function deleteGeneratedFile(sourcePath: string, ) {

}

export function getGeneratedFilePath(sourcePath: string) {
  //  const 
}

/**
 *  Writes the content to file(if directory doesn't exist it will create directory) 
 * @param path 
 * @param content 
 */
export function writeFileE(path: string, content: string) {
  const dir = dirname(path)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  fs.writeFileSync(path, content)
}

/**
 *  header message for generated files
 */
export function dontModifyMessage() {
  return `// this file is auto generated on ${new Date().toISOString()}, don't modify it`
}

/**
 *  if reducer defined in subfolders of reducers folder then get subfolders path as prefix
 *   (Example : reducers/one/Sample.ts  group = ${PREFIX}/Sample = one/Sample )
 * @param file 
 */
export function getPrefixPathForReducerGroup(file: string) {
  const dir = dirname(file)
  const reducersPath = config.reducersPath
  const result = dir.replace(reducersPath, "").split(sep).join("/")
  return result === "" ? result : `${result}/`
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

