
    
    import f1_f1_c from "./f1_c/f1ctypes" 
import f1 from "./f1stypes" 
import { GRPCSerializer,GRPCDeSerializer, GRPCUnary,GRPCResponseStream,Transform} from "@typesafe-store/store"
     
    namespace f1types {
        export type Hello = { name: string, sname ?:f1.HelloS }
export const enum HelloEnum {
        HELLO_1 = 0,
HELLO_2 = 1
    } 
    }
    export default f1types
  