
import { FetchPost } from "@typesafe-store/reducer"
export namespace codeSandbox {

    export namespace queries {

        export namespace todos2 {

            type getTodo1 = Readonly<{ todo: Readonly<{ text: string | null }> | null }>
            type getTodo1Variables = undefined
            export type GetTodos = FetchPost<{ path: "https://vous9.sse.codesandbox.io/" }, {
                query: `
  query getTodo1 {
      todo {
          text
      }
  }
`
            }, getTodo1, "GraphqlError[]">

        }

    }



}

const getT: codeSandbox.queries.todos2.GetTodos = {}