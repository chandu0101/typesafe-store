
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


export class GraphqlTypGen {

    /**
     *  verifies whether given document node only contains query/mutation/subscription
     * @param document 
     */
    static isValidQueryDocument(document: DocumentNode): [boolean, string] {
        let result: [boolean, string] = [true, ""]
        let isQuery = false
        let isMutation = false
        let isSubscription = false
        visit(document, {
            enter(node) {
                if (node.kind === "OperationDefinition") {
                    if (node.operation === "query") {
                        if (isMutation || isSubscription) {
                            result = [false, "You canot combine query with mutation/subscription"]
                            return BREAK
                        }
                        isQuery = true
                    } else if (node.operation === "mutation") {
                        if (isQuery || isSubscription) {
                            result = [false, "You canot combine mutation with query/subscription"]
                            return BREAK
                        }
                        isMutation = true
                    } else if (node.operation === "subscription") {
                        if (isMutation || isQuery) {
                            result = [false, "You canot combine subscription with query/mutation"]
                            return BREAK
                        }
                        isSubscription = true
                    }
                }
            }
        })
        if (result[0]) {
            if (!isQuery || !isMutation || !isSubscription) {
                result = [false, "fragment"]
            }
        }
        return result
    }

    static generateType(documentNode: DocumentNode, schema: GraphQLSchema): string {
        let result = ""
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
                    statements.push(
                        this.createTsTypeDeclaration(
                            node.name ? node.name.value : 'QueryResult',
                            resultFieldElementStack.consume(),
                        ),
                    );
                    statements.push(
                        this.createTsTypeDeclaration(
                            node.name ? node.name.value + 'Variables' : 'QueryVariables',
                            variableElementStack.consume(),
                        ),
                    );
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
                enter(node) {

                },
                leave(node) {

                }
            },
            FragmentSpread: {
                leave(node) {

                }
            },
            InlineFragment: {
                enter(node) {

                },
                leave(node) {

                }
            },
            Field: {

            }
        })

        return result
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
            toIntersectionElements.push(toUnionElements.join(" | "));
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
                typeNode = `${typeNode} | null`;
            }
        }
        return typeNode;
    }

} 