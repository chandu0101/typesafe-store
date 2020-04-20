
    // this file is auto generated on 2020-04-19T23:43:14.519Z, don't modify it
    import codeSandbox_types from "../types";
import {FetchVariants} from "@typesafe-store/store"
    class CodeSandboxRequestCreators {
        
         static queries = class {
            static sample = class {
                
                         static q1Request(optimisticResponse?: codeSandbox_types.queries.sample.q1.Request) {
                            return { url:{path:"https://vous9.sse.codesandbox.io/"} , type: FetchVariants.POST,
                            body : {query: `
query one {
    todo {
      text
    }
  }
`,},
                            optimisticResponse}
                         }   
                     

                           static mq1Request(optimisticResponse?: [codeSandbox_types.queries.sample.mq1.Request,codeSandbox_types.queries.sample.mq1.Request]) {
                               return {type: FetchVariants.POST, url:{path:"https://vous9.sse.codesandbox.io/"} ,body : [
                                {query: `
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

`,operationName:"one",}, {query: `
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

`,operationName:"two",}
                               ],optimisticResponse }
                           }
                        
            }
         }
       
        
        
    }
    export default CodeSandboxRequestCreators
   