
      import f1_f1_c from "./f1_c/f1ctypes" 
import f1 from "./f1stypes" 
import { GRPCSerializer,GRPCDeSerializer, GRPCUnary,GRPCResponseStream,Transform} from "@typesafe-store/store"
import f1_types from "../../types/f1/f1types"

     //@ts-ignore 
     import * as pbf from "pbf"
    

      //@ts-ignore
      import Pbf from "pbf"
    

      class F1typesSerializers {
          static Hello = class Hello {
         

         private static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 1) {
                    obj.name = pbf.readString()
                       
                }
else if (tag === 2) {
                    obj.sname = f1.HelloS._read(pbf, pbf.readVarint() + pbf.pos)
                       
                }
         }
         static _read(pbf:any,end?:any):f1_types.Hello {
            return pbf.readFields(this._readField, {name:"",sname:undefined}, end) as any;
         }

         static deserialize(buffer:Uint8Array):f1_types.Hello {
             const pbf = new Pbf(buffer)
             return this._read(pbf)
         }
          
         static serialize(obj:f1_types.Hello) {
             const pbf = new Pbf()
             this._write(obj,pbf)
             return pbf.finish()
         }


         static _write(obj:f1_types.Hello,pbf:any) {
             if (obj.name) pbf.writeStringField(1, obj.name);
if (obj.sname) pbf.writeMessage(2, f1.HelloS._write, obj.sname);;
         }
      }
    
      } 
      export default F1typesSerializers
    