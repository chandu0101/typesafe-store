
    // this file is auto generated on 2020-04-19T23:43:14.518Z, don't modify it
    import { GraphqlQuery,GraphqlMutation,GraphqlSubscription,GraphQLError } from "@typesafe-store/store"
     namespace codeSandbox {
        
         export namespace queries {
             
             export namespace sample {
                
                     export namespace q1 {
                         
                         export type one = Readonly<{todo :Readonly<{text :string | null}> | null}>
                         export type Request =  GraphqlQuery<"https://vous9.sse.codesandbox.io/",{query: `
query one {
    todo {
      text
    }
  }
`,},one,GraphQLError[]>
                        
                     }
                    

                     export namespace mq1 {
                         
                         export type one = Readonly<{todo :Readonly<{text :string | null}> | null}>

export type two = Readonly<{todo :Readonly<{text :string | null}> | null}>
                         export type Request =  GraphqlQuery<"https://vous9.sse.codesandbox.io/",[{query: `
query one {
    todo {
      text
    }
  }
  
  query two {
    todo {
      text
    }
  }

`,operationName:"one" ,}, {query: `
query one {
    todo {
      text
    }
  }
  
  query two {
    todo {
      text
    }
  }

`,operationName:"two" ,}],[one,two],[GraphQLError[],GraphQLError[]]>
                        
                     }
                    
             }
           
         }
       
        
        
    }
    export default codeSandbox
   