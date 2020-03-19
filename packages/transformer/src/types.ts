
import * as ts from "typescript";

export type LocalPropertyDecls = {
    pd: ts.PropertyDeclaration;
    type: ts.Type;
    typeStr: string;
};

export type Meta = {
    isOptional?: boolean;
    type: MetaType;
    access?: EAccess[];
};

export type EAccess = {
    name: string;
    type: MetaType;
    exp: ts.Expression;
    isOptional?: boolean;
};

export type MetaValue = { name: string; meta: Meta };
export type ProcessThisResult = { g: string; v: string; values: MetaValue[] };

export const enum MetaType {
    OBJECT,
    ARRAY,
    UNKNOWN,
    SET,
    MAP
}

/**
 * 
 */
export type GlobalInMemory = {
    path: string,
    fullPath: string,
    group: string,
    asyncActions: { name: string, type: string }[]
}