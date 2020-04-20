
    
    import f1 from "./f1/f1types" 
import { GRPCSerializer,GRPCDeSerializer, GRPCUnary,GRPCResponseStream,Transform} from "@typesafe-store/store"
import f1_f1_c from "./f1/f1_c/f1ctypes" 
     
    namespace addressBook {
        export const enum PhoneType2 {
        MOBILE = 0,
HOME = 1,
WORK = 2
    } 
export type Person = { name: string, id: number, email: string, bf: Uint8Array | string, projects:Record<string,string>, helloEnum :f1.HelloEnum, ipC ?:f1_f1_c.F1CM, mapEnum :f1.HelloEnum, phones ?:Person_PhoneNumber[], last_updated ?:f1.Hello, mapMessage ?:Person_PhoneNumber, mapOneOfMessage ?:Person_SampleMessage, oneofMessageField ?:Person_SampleMessage }
export type AddressBook = { people ?:Person[] }
export type HelloRequest = { name: string }
export type RepeatHelloRequest = { name: string, count: number }
export type HelloReply = { message: string }

              export namespace Greeter {
                   export  type SayHello<S extends GRPCSerializer<HelloRequest>,DS extends GRPCDeSerializer<HelloReply>,T extends Transform<HelloReply,any> | null = null> = GRPCResponseStream<"/tutorial.Greeter/SayHello",HelloRequest,HelloReply,S,DS,T>
export  type SayRepeatHello<S extends GRPCSerializer<RepeatHelloRequest>,DS extends GRPCDeSerializer<HelloReply>,T extends Transform<HelloReply,any> | null = null> = GRPCUnary<"/tutorial.Greeter/SayRepeatHello",RepeatHelloRequest,HelloReply,S,DS,T>
export  type SayHelloAfterDelay<S extends GRPCSerializer<HelloRequest>,DS extends GRPCDeSerializer<HelloReply>,T extends Transform<HelloReply,any> | null = null> = GRPCResponseStream<"/tutorial.Greeter/SayHelloAfterDelay",HelloRequest,HelloReply,S,DS,T>
               }
            

              export namespace Greeter2 {
                   export  type SayHello2<S extends GRPCSerializer<HelloRequest>,DS extends GRPCDeSerializer<HelloReply>,T extends Transform<HelloReply,any> | null = null> = GRPCResponseStream<"/tutorial.Greeter2/SayHello2",HelloRequest,HelloReply,S,DS,T>
export  type SayRepeatHello2<S extends GRPCSerializer<RepeatHelloRequest>,DS extends GRPCDeSerializer<HelloReply>,T extends Transform<HelloReply,any> | null = null> = GRPCUnary<"/tutorial.Greeter2/SayRepeatHello2",RepeatHelloRequest,HelloReply,S,DS,T>
export  type SayHelloAfterDelay2<S extends GRPCSerializer<HelloRequest>,DS extends GRPCDeSerializer<HelloReply>,T extends Transform<HelloReply,any> | null = null> = GRPCResponseStream<"/tutorial.Greeter2/SayHelloAfterDelay2",HelloRequest,HelloReply,S,DS,T>
               }
            
export const enum Person_PhoneType {
        MOBILE = 0,
HOME = 1,
WORK = 2
    } 
export type Person_PhoneNumber_PhoneNumber2 = { number2: string } 
export type Person_PhoneNumber = { number: string, type :Person_PhoneType, number2 ?:Person_PhoneNumber_PhoneNumber2 } 
export type Person_SampleMessage = { name: string, sub_message ?:Person_PhoneNumber, test_oneof ?: "name" | "sub_message" } 
    }
    export default addressBook
  