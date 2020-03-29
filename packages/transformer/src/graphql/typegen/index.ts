
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

    static generateType(document: DocumentNode): string {
        let result = ""
        const parentNodes = []
        const fragmentMap = new Map<string, FragmentDefinitionNode>()
        document.definitions.forEach(def => {
            if (def.kind === "FragmentDefinition") {
                fragmentMap.set(def.name.value, def)
            }
        })
        visit(document, {
            OperationDefinition: {
                enter(node) {

                },
                leave(node) {

                }
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
            VariableDefinition: {
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
} 