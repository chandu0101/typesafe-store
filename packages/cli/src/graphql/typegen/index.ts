
import * as ts from "typescript";
import {
    GraphQLSchema,
    DocumentNode,
    FieldNode,
    FragmentDefinitionNode,
    ASTNode,
    NamedTypeNode,
    TypeNode,
    GraphQLScalarType,
    GraphQLEnumType,
    GraphQLObjectType,
    GraphQLUnionType,
    GraphQLInterfaceType,
    GraphQLInputObjectType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLField,
    GraphQLInputField,
    GraphQLInputType,
    visit,
    BREAK,
    GraphQLOutputType,
} from 'graphql';
import { GraphqlOperation } from "../types";
import { string } from "@mojotech/json-type-validation";

type ListTypeKind = 'none' | 'nullableList' | 'strictList';

type GraphQLFragmentTypeConditionNamedType = GraphQLObjectType | GraphQLUnionType | GraphQLInterfaceType;

interface FieldModifier {
    list: ListTypeKind;
    strict: boolean;
}

interface FieldMetadata extends FieldModifier {
    fieldType: GraphQLOutputType;
}

interface FieldTypeElement {
    members: { name: string, type: string, optional?: boolean }[];
    typeFragments: {
        isUnionCondition: boolean;
        typeNode: string;
    }[];
}

class Stack<T> {

    private readonly array: T[] = []

    constructor(private readonly initializer?: () => T) {

    }

    stack(value?: T) {
        if (!value && this.initializer) {
            this.array.push(this.initializer())
        } else if (value) {
            this.array.push(value)
        }
    }

    get current() {
        if (!this.array.length) {
            throw new Error("No Elements Stack Error")
        }
        return this.array[this.array.length - 1]
    }

    consume() {
        const c = this.current
        this.array.pop()
        return c;
    }

    isEmpty() {
        return this.array.length === 0;
    }

}

type DocumentNodeValidationResult = { operation?: GraphqlOperation, errorMessage?: string, isFragment?: boolean }

type GenTypeResult = { types: string, operations: { name: string, variables?: string }[] }

export class GraphqlTypGen {

    /**
     *  verifies whether given document node only contains query/mutation/subscription
     * @param document 
     */
    static isValidQueryDocument(document: DocumentNode): DocumentNodeValidationResult {
        let result: DocumentNodeValidationResult = {}
        visit(document, {
            enter(node) {
                if (node.kind === "OperationDefinition") {
                    const op = result.operation
                    if (node.operation === "query") {
                        if (op === GraphqlOperation.MUTATION || op === GraphqlOperation.SUBSCRIPTION) {
                            result = { errorMessage: "You canot combine query with mutation/subscription" }
                            return BREAK
                        }
                        result.operation = GraphqlOperation.QUERY
                    } else if (node.operation === "mutation") {
                        if (op === GraphqlOperation.QUERY || op === GraphqlOperation.SUBSCRIPTION) {
                            result = { errorMessage: "You canot combine mutation with query/subscription" }
                            return BREAK
                        }
                        result.operation = GraphqlOperation.MUTATION
                    } else if (node.operation === "subscription") {
                        if (op === GraphqlOperation.MUTATION || op === GraphqlOperation.QUERY) {
                            result = { errorMessage: "You canot combine subscription with query/mutation" }
                            return BREAK
                        }
                        result.operation = GraphqlOperation.SUBSCRIPTION
                    }
                }
            }
        })
        if (!result.errorMessage) {
            if (!result.operation) {
                result = { isFragment: true }
            }
        }
        return result
    }

    static generateType(documentNode: DocumentNode, schema: GraphQLSchema): GenTypeResult {
        let result: GenTypeResult = {} as any
        const statements: string[] = [];
        const parentTypeStack = new Stack<GraphQLFragmentTypeConditionNamedType>();
        const resultFieldElementStack = new Stack<FieldTypeElement>(() => ({
            members: [],
            typeFragments: [],
        }));
        const variableElementStack = new Stack<FieldTypeElement>(() => ({
            members: [],
            typeFragments: [],
        }));
        const fieldMetadataMap = new Map<FieldNode, FieldMetadata>();
        const fragmentMap = new Map<string, FragmentDefinitionNode>();
        documentNode.definitions.forEach(def => {
            if (def.kind === 'FragmentDefinition') {
                fragmentMap.set(def.name.value, def);
            }
        });

        const operations: GenTypeResult["operations"] = []

        visit(documentNode, {
            OperationDefinition: {
                enter: node => {
                    if (node.operation === 'query') {
                        const queryType = schema.getQueryType()!;
                        parentTypeStack.stack(queryType);
                        resultFieldElementStack.stack();
                    } else if (node.operation === 'mutation') {
                        const mutationType = schema.getMutationType()!;
                        parentTypeStack.stack(mutationType);
                        resultFieldElementStack.stack();
                    } else if (node.operation === 'subscription') {
                        const subscriptionType = schema.getSubscriptionType()!;
                        parentTypeStack.stack(subscriptionType);
                        resultFieldElementStack.stack();
                    }
                    variableElementStack.stack();
                },
                leave: node => {
                    const opType = node.name ? node.name.value : 'QueryResult'
                    statements.push(
                        this.createTsTypeDeclaration(
                            opType,
                            resultFieldElementStack.consume(),
                        ),
                    );
                    const vn = node.name ? node.name.value + 'Variables' : 'QueryVariables'
                    const vt = this.createTsFieldTypeNode(variableElementStack.consume())
                    if (vt.trim() === "undefined") {
                        operations.push({ name: opType })
                    } else {
                        statements.push(`export type ${vn} = ${vt}`)
                        operations.push({ name: opType, variables: vn })
                    }
                    parentTypeStack.consume();
                },
            },
            VariableDefinition: {
                leave: node => {
                    const {
                        typeNode: {
                            name: { value: inputTypeName },
                        },
                        list,
                        strict,
                    } = this.getFieldMetadataFromTypeNode(node.type);
                    const variableType = schema.getType(inputTypeName)! as GraphQLInputType;
                    const visitVariableType = (
                        name: string,
                        variableType: GraphQLInputType,
                        list: ListTypeKind,
                        strict: boolean,
                        optional: boolean,
                    ) => {
                        let typeNode: string | undefined;
                        if (variableType instanceof GraphQLScalarType) {
                            typeNode = this.createTsTypeNodeFromScalar(variableType);
                        } else if (variableType instanceof GraphQLEnumType) {
                            typeNode = this.createTsTypeNodeFromEnum(variableType);
                        } else if (variableType instanceof GraphQLInputObjectType) {
                            variableElementStack.stack();
                            Object.entries(variableType.getFields()).forEach(([fieldName, v]) => {
                                const { fieldType, list, strict } = this.getFieldMetadataFromFieldTypeInstance(v);
                                visitVariableType(fieldName, fieldType, list, strict, false);
                            });
                            typeNode = this.createTsFieldTypeNode(variableElementStack.consume());
                        }
                        if (!typeNode) {
                            throw new Error('Unknown variable input type. ' + variableType.toJSON());
                        }
                        typeNode = this.wrapTsTypeNodeWithModifiers(typeNode, list, strict);
                        variableElementStack.current.members.push(
                            { name, optional, type: typeNode }
                        );
                    };
                    visitVariableType(node.variable.name.value, variableType, list, strict, !!node.defaultValue);
                },
            },
            FragmentDefinition: {
                enter: node => {
                    const conditionNamedType = schema.getType(
                        node.typeCondition.name.value,
                    )! as GraphQLFragmentTypeConditionNamedType;
                    parentTypeStack.stack(conditionNamedType);
                    resultFieldElementStack.stack();
                },
                leave: node => {
                    statements.push(this.createTsTypeDeclaration(node.name.value, resultFieldElementStack.consume()));
                    parentTypeStack.consume();
                },
            },
            FragmentSpread: {
                leave: node => {
                    const fragmentDefNode = fragmentMap.get(node.name.value)!;
                    const isUnionCondition = this.isConcreteTypeOfParentUnionType(
                        fragmentDefNode.typeCondition,
                        parentTypeStack.current,
                    );
                    resultFieldElementStack.current.typeFragments.push({
                        isUnionCondition,
                        typeNode: node.name.value,
                    });
                },
            },
            InlineFragment: {
                enter: node => {
                    if (!node.typeCondition) return;
                    const conditionNamedType = schema.getType(
                        node.typeCondition.name.value,
                    )! as GraphQLFragmentTypeConditionNamedType;
                    parentTypeStack.stack(conditionNamedType);
                    resultFieldElementStack.stack();
                },
                leave: node => {
                    if (!node.typeCondition) return;
                    parentTypeStack.consume();
                    const typeNode = this.createTsFieldTypeNode(resultFieldElementStack.consume());
                    const isUnionCondition = this.isConcreteTypeOfParentUnionType(node.typeCondition, parentTypeStack.current);
                    resultFieldElementStack.current.typeFragments.push({
                        isUnionCondition,
                        typeNode,
                    });
                },
            },
            Field: {
                enter: node => {
                    if (node.name.value === '__typename') return;

                    const field = (parentTypeStack.current as any).getFields()[node.name.value];

                    const fieldMetadata = this.getFieldMetadataFromFieldTypeInstance(field!);
                    if (
                        fieldMetadata.fieldType instanceof GraphQLObjectType ||
                        fieldMetadata.fieldType instanceof GraphQLInterfaceType ||
                        fieldMetadata.fieldType instanceof GraphQLUnionType
                    ) {
                        parentTypeStack.stack(fieldMetadata.fieldType);
                        resultFieldElementStack.stack();
                    }
                    fieldMetadataMap.set(node, fieldMetadata as any);
                },
                leave: node => {
                    if (node.name.value === '__typename') {
                        resultFieldElementStack.current.members.push(
                            this.createTsDoubleUnderscoreTypenameFieldType(parentTypeStack.current),
                        );
                        return;
                    }
                    const { fieldType, strict, list } = fieldMetadataMap.get(node)!;
                    let typeNode: string | undefined;
                    if (fieldType instanceof GraphQLScalarType) {
                        typeNode = this.createTsTypeNodeFromScalar(fieldType);
                    } else if (fieldType instanceof GraphQLEnumType) {
                        typeNode = this.createTsTypeNodeFromEnum(fieldType);
                    } else if (
                        fieldType instanceof GraphQLObjectType ||
                        fieldType instanceof GraphQLInterfaceType ||
                        fieldType instanceof GraphQLUnionType
                    ) {
                        typeNode = this.createTsFieldTypeNode(resultFieldElementStack.consume());
                        parentTypeStack.consume();
                    }
                    if (!typeNode) {
                        throw new Error('Unknown field output type. ' + fieldType.toJSON());
                    }
                    typeNode = this.wrapTsTypeNodeWithModifiers(typeNode, list, strict);
                    resultFieldElementStack.current.members.push(
                        { name: node.name.value, type: typeNode! }
                    );
                    fieldMetadataMap.delete(node);
                },
            },
        })
        result.types = `${statements.join("\n\n")}`
        result.operations = operations
        return result
    }

    private static isConcreteTypeOfParentUnionType(
        typeCondition: NamedTypeNode,
        parentType: GraphQLFragmentTypeConditionNamedType,
    ) {
        if (parentType instanceof GraphQLUnionType) {
            const unionElementTypes = parentType.getTypes();
            return unionElementTypes.some(ut => ut.name === typeCondition.name.value);
        } else {
            return false;
        }
    }

    private static getFieldMetadataFromTypeNode(node: TypeNode) {
        let typeNode = node;
        let listTypeKind: ListTypeKind | undefined;
        let isStrict: boolean | undefined;
        if (typeNode.kind === 'NonNullType') {
            typeNode = typeNode.type;
            if (typeNode.kind === 'ListType') {
                typeNode = typeNode.type;
                listTypeKind = 'strictList';
                if (typeNode.kind === 'NonNullType') {
                    typeNode = typeNode.type;
                    isStrict = true;
                } else {
                    isStrict = false;
                }
            } else {
                isStrict = true;
                listTypeKind = 'none';
            }
        } else if (typeNode.kind === 'ListType') {
            typeNode = typeNode.type;
            listTypeKind = 'nullableList';
            if (typeNode.kind === 'NonNullType') {
                typeNode = typeNode.type;
                isStrict = true;
            } else {
                isStrict = false;
            }
        } else {
            listTypeKind = 'none';
            isStrict = false;
        }
        return { typeNode: typeNode as NamedTypeNode, list: listTypeKind, strict: isStrict };
    }

    private static createTsTypeDeclaration(alias: string, fieldElement: FieldTypeElement) {
        return `export type ${alias} = ${this.createTsFieldTypeNode(fieldElement)}`
    }

    private static createTsTypeNodeFromScalar(fieldType: GraphQLScalarType): string {
        switch (fieldType.name) {
            case 'Boolean':
                return "boolean";
            case 'String':
            case 'ID':
                return "string";
            case 'Int':
            case 'Float':
                return "number";
            default:
                return "any";
        }
    }

    private static getFieldMetadataFromFieldTypeInstance<T extends GraphQLField<any, any> | GraphQLInputField>(field: T) {
        let fieldType = field!.type;
        let listTypeKind: ListTypeKind | undefined;
        let isStrict: boolean | undefined;
        if (fieldType instanceof GraphQLNonNull) {
            fieldType = fieldType.ofType;
            if (fieldType instanceof GraphQLList) {
                fieldType = fieldType.ofType;
                listTypeKind = 'strictList';
                if (fieldType instanceof GraphQLNonNull) {
                    fieldType = fieldType.ofType;
                    isStrict = true;
                } else {
                    isStrict = false;
                }
            } else {
                isStrict = true;
                listTypeKind = 'none';
            }
        } else if (fieldType instanceof GraphQLList) {
            fieldType = fieldType.ofType;
            listTypeKind = 'nullableList';
            if (fieldType instanceof GraphQLNonNull) {
                fieldType = fieldType.ofType;
                isStrict = true;
            } else {
                isStrict = false;
            }
        } else {
            listTypeKind = 'none';
            isStrict = false;
        }
        return {
            fieldType: fieldType as T extends GraphQLField<any, any>
                ? GraphQLOutputType
                : T extends GraphQLInputField
                ? GraphQLInputType
                : never,
            list: listTypeKind,
            strict: isStrict,
        };
    }

    private static createTsFieldTypeNode({ members, typeFragments }: FieldTypeElement): string {
        if (!members.length && !typeFragments.length) {
            return "undefined"
        }
        const toUnionElements: string[] = [];
        const toIntersectionElements: string[] = [];
        typeFragments.forEach(({ isUnionCondition, typeNode }) => {
            if (isUnionCondition) {
                toUnionElements.push(typeNode);
            } else {
                toIntersectionElements.push(typeNode);
            }
        });
        if (toUnionElements.length) {
            toIntersectionElements.push(`(${toUnionElements.join(" | ")})`);
        }
        if (members.length) {
            toIntersectionElements.unshift(`Readonly<{${members.map(m => `${m.name}${m.optional ? "?" : ""} :${m.type}`).join(", ")}}>`);
        }
        return `${toIntersectionElements.join(" & ")}`;
    }

    private static createTsTypeNodeFromEnum(fieldType: GraphQLEnumType) {
        return `${fieldType.getValues().map(ft => ft.value).join(" | ")}`
    }

    private static wrapTsTypeNodeWithModifiers(typeNode: string, list: ListTypeKind, strict: boolean) {
        if (!strict) {
            typeNode = `${typeNode} | null`
        }
        if (list === 'strictList' || list === 'nullableList') {
            typeNode = `${typeNode}[]`;
            if (list === 'nullableList') {
                typeNode = `(${typeNode} | null)`;
            }
        }
        return typeNode;
    }



    private static createTsDoubleUnderscoreTypenameFieldType(parentType: GraphQLFragmentTypeConditionNamedType) {
        if (parentType instanceof GraphQLObjectType) {
            return { name: '__typename', type: parentType.name }
        } else if (parentType instanceof GraphQLUnionType) {
            return { name: '__typename', type: `${parentType.getTypes().map(t => t.name).join(" | ")}` }
        } else {
            return { name: '__typename', type: "string" }
        }
    }

} 