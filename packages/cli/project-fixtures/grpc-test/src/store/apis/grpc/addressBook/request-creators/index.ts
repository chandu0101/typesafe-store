
        import addressBook_types from "../types"
        import { FetchVariants} from "@typesafe-store/store"
        
        class AddressBookRequestCreators {
            
                  static Greeter = class {
                      
         static createSayHelloRequest(req:addressBook_types.HelloRequest,optimisticResponse?:addressBook_types.HelloReply) {
              return {type: FetchVariants.POST, url: {path:/tutorial.Greeter/SayHello} ,body:req, optimisticResponse}
          }
        

         static createSayRepeatHelloRequest(req:addressBook_types.RepeatHelloRequest) {
              return { type: FetchVariants.POST,url: {path:"/tutorial.Greeter/SayRepeatHello"} ,body:req }
          }
        

         static createSayHelloAfterDelayRequest(req:addressBook_types.HelloRequest,optimisticResponse?:addressBook_types.HelloReply) {
              return {type: FetchVariants.POST, url: {path:/tutorial.Greeter/SayHelloAfterDelay} ,body:req, optimisticResponse}
          }
        
                  }
                

                  static Greeter2 = class {
                      
         static createSayHello2Request(req:addressBook_types.HelloRequest,optimisticResponse?:addressBook_types.HelloReply) {
              return {type: FetchVariants.POST, url: {path:/tutorial.Greeter2/SayHello2} ,body:req, optimisticResponse}
          }
        

         static createSayRepeatHello2Request(req:addressBook_types.RepeatHelloRequest) {
              return { type: FetchVariants.POST,url: {path:"/tutorial.Greeter2/SayRepeatHello2"} ,body:req }
          }
        

         static createSayHelloAfterDelay2Request(req:addressBook_types.HelloRequest,optimisticResponse?:addressBook_types.HelloReply) {
              return {type: FetchVariants.POST, url: {path:/tutorial.Greeter2/SayHelloAfterDelay2} ,body:req, optimisticResponse}
          }
        
                  }
                
        }
        export default AddressBookRequestCreators
      