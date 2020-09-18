
      import { GRPCSerializer,GRPCDeSerializer, GRPCUnary,GRPCResponseStream,Transform} from "@typesafe-store/store"
import f1_f1_c_types from "../../../types/f1/f1_c/f1ctypes"

     //@ts-ignore 
     import * as pbf from "pbf"
    

      //@ts-ignore
      import Pbf from "pbf"
    

      class F1ctypesSerializers {
          static F1CM = class F1CM {
         

         private static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 1) {
                    obj.name = pbf.readString()
                       
                }
         }
         static _read(pbf:any,end?:any):f1_f1_c_types.F1CM {
            return pbf.readFields(this._readField, {name:""}, end) as any;
         }

         static deserialize(buffer:Uint8Array):f1_f1_c_types.F1CM {
             const pbf = new Pbf(buffer)
             return this._read(pbf)
         }
          
         static serialize(obj:f1_f1_c_types.F1CM) {
             const pbf = new Pbf()
             this._write(obj,pbf)
             return pbf.finish()
         }


         static _write(obj:f1_f1_c_types.F1CM,pbf:any) {
             if (obj.name) pbf.writeStringField(1, obj.name);
         }
      }
    
      } 
      export default F1ctypesSerializers
    