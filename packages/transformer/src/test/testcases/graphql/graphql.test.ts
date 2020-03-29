
import fetch from "node-fetch"
import { buildSchema, parse, validate, visit } from "graphql"

describe("graphql", () => {

    const url = "https://vous9.sse.codesandbox.io/"



    test("multiple operations", async () => {
        //https://github.com/wp-graphql/wp-graphql/issues/653
        const query1 = `
        query one {
         todo {
           text
         }
       }
      
       `

        const query2 = `
       query two {
       hello
      }
       `

        const body = [{ query: query1, }, { query: query2, }]
        const data = await fetch(url, {
            method: "POST", headers: {
                'Content-Type': 'application/json',
            }, body: JSON.stringify(body)
        })
        if (data.ok) {
            const resp = await data.json()
            console.log("Resp : ", resp);
        }
        console.log("Erron in req", data.statusText);
    })

    test.only("understand visit", () => {

        const schemaSDL = `
        type Todo {
          text: String
        }
        type Query {
          hello: String
          hello1: String
          todo: Todo
          varQ(id:Int):Todo
        }
      `;

        const schema = buildSchema(schemaSDL)

        const q = `
          query one {
              todo {
                  text
              }
          }
        `

        const queryWithV = `
         
        query oneV($id:Int) {
              varQ(id:$id) {
                  text,
                  ... on Todo {
                      text
                  }

              }
          }
         
          
        
        `

        const ast = parse(queryWithV)

        const errors = validate(schema, ast)

        if (errors.length > 0) {
            console.log(`Gql Erros : ${JSON.stringify(errors)}`);
            return
        }

        visit(ast, {
            OperationDefinition: {
                enter(node) {
                    console.log(`Enter : OperationDefinition : ${node.name?.value}`);
                },
                leave(node) {
                    console.log(`Leave : OperationDefinition : ${node.name?.value}`);
                }
            },
            FragmentDefinition: {
                enter(node) {
                    console.log(`Enter : FragmentDefinition : ${node.name.value}`);
                },
                leave(node) {
                    console.log(`Leave : FragmentDefinition : ${node.name.value}`);
                }
            },
            FragmentSpread: {
                leave(node) {
                    console.log(`Leave : FragmentSpread : ${node.name.value}`);
                }
            },
            InlineFragment: {
                enter(node) {
                    console.log(`Enter : InlineFragment : ${node}`);
                },
                leave(node) {
                    console.log(`Leave : InlineFragment : ${node}`);
                }
            },
            VariableDefinition: {
                enter(node) {
                    console.log(`Enter : VariableDefinition : ${node}`);
                },
                leave(node) {
                    console.log(`Leave : VariableDefinition : ${node}`);
                }
            },
            Field: {
                enter(node) {
                    console.log(`Enter : Field : ${node.name.value}`);
                },
                leave(node) {
                    console.log(`Leave : Field : ${node.name.value}`);
                }
            }

        })
        console.log("Done Visit")

    })


})