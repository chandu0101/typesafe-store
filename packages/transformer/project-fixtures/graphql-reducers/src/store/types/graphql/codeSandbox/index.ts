
// this file is auto generated on 2020-03-30T12:23:40.214Z, don't modify it
import { FetchPost } from "@typesafe-store/reducer"
export namespace codeSandbox {

    export namespace queries {

        export namespace todos2 {

            type tTFrag = Readonly<{ text: string | null }>

            type getTodo1 = Readonly<{ todo: Readonly<{ text: string | null }> & tTFrag | null }>
            export type GetTodos = FetchPost<{ path: "https://vous9.sse.codesandbox.io/" }, {
                query: `
  
  fragment tTFrag on Todo {
      text
  }

  query getTodo1 {
      todo {
          text,
          ...tTFrag
      }
  }
`,
            }, getTodo1, "GraphqlError[]">

        }

    }



}
