
      import f1 from "./f1/f1types" 
import { GRPCSerializer,GRPCDeSerializer, GRPCUnary,GRPCResponseStream,Transform} from "@typesafe-store/store"
import f1_f1_c from "./f1/f1_c/f1ctypes" 
import addressBook_types from "../types"

     //@ts-ignore 
     import * as pbf from "pbf"
    

      //@ts-ignore
      import Pbf from "pbf"
    

      class AddressBookSerializers {
          static Person = class Person {
         static PhoneNumber = class PhoneNumber {
         static PhoneNumber2 = class PhoneNumber2 {
         

         private static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 1) {
                    obj.number2 = pbf.readString()
                       
                }
         }
         static _read(pbf:any,end?:any):addressBook_types.Person_PhoneNumber_PhoneNumber2 {
            return pbf.readFields(this._readField, {number2:""}, end) as any;
         }

         static deserialize(buffer:Uint8Array):addressBook_types.Person_PhoneNumber_PhoneNumber2 {
             const pbf = new Pbf(buffer)
             return this._read(pbf)
         }
          
         static serialize(obj:addressBook_types.Person_PhoneNumber_PhoneNumber2) {
             const pbf = new Pbf()
             this._write(obj,pbf)
             return pbf.finish()
         }


         static _write(obj:addressBook_types.Person_PhoneNumber_PhoneNumber2,pbf:any) {
             if (obj.number2) pbf.writeStringField(1, obj.number2);
         }
      }
    

         private static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 1) {
                    obj.number = pbf.readString()
                       
                }
else if (tag === 2) {
                    obj.type = pbf.readVarint()
                       
                }
else if (tag === 3) {
                    obj.number2 = AddressBookSerializers.Person.PhoneNumber.PhoneNumber2._read(pbf, pbf.readVarint() + pbf.pos)
                       
                }
         }
         static _read(pbf:any,end?:any):addressBook_types.Person_PhoneNumber {
            return pbf.readFields(this._readField, {number:"",type:0,number2:undefined}, end) as any;
         }

         static deserialize(buffer:Uint8Array):addressBook_types.Person_PhoneNumber {
             const pbf = new Pbf(buffer)
             return this._read(pbf)
         }
          
         static serialize(obj:addressBook_types.Person_PhoneNumber) {
             const pbf = new Pbf()
             this._write(obj,pbf)
             return pbf.finish()
         }


         static _write(obj:addressBook_types.Person_PhoneNumber,pbf:any) {
             if (obj.number) pbf.writeStringField(1, obj.number);
if (obj.type) pbf.writeVarintField(2, obj.type);
if (obj.number2) pbf.writeMessage(3, AddressBookSerializers.Person.PhoneNumber.PhoneNumber2._write, obj.number2);;
         }
      }
    
static SampleMessage = class SampleMessage {
         

         private static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 4) {
                    obj.name = pbf.readString()
                    obj.test_oneof = "name"   
                }
else if (tag === 9) {
                    obj.sub_message = AddressBookSerializers.Person.PhoneNumber._read(pbf, pbf.readVarint() + pbf.pos)
                    obj.test_oneof = "sub_message"   
                }
         }
         static _read(pbf:any,end?:any):addressBook_types.Person_SampleMessage {
            return pbf.readFields(this._readField, {name:"",sub_message:undefined}, end) as any;
         }

         static deserialize(buffer:Uint8Array):addressBook_types.Person_SampleMessage {
             const pbf = new Pbf(buffer)
             return this._read(pbf)
         }
          
         static serialize(obj:addressBook_types.Person_SampleMessage) {
             const pbf = new Pbf()
             this._write(obj,pbf)
             return pbf.finish()
         }


         static _write(obj:addressBook_types.Person_SampleMessage,pbf:any) {
             if (obj.name) pbf.writeStringField(4, obj.name);
if (obj.sub_message) pbf.writeMessage(9, AddressBookSerializers.Person.PhoneNumber._write, obj.sub_message);;
         }
      }
    
static _FieldEntry7 = class {
         
         static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 1) obj.key = pbf.readString();
            else if (tag === 2) obj.value = pbf.readString();
         }

         static read(pbf:any,end:any) {
             return pbf.readFields(this._readField, {key: "", value: ""},end)
         }

         static write(obj:any,pbf:any) {
            if (obj.key) pbf.writeStringField(1, obj.key)
            if (obj.value) pbf.writeStringField(2, obj.value)
         }

     }

         private static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 1) {
                    obj.name = pbf.readString()
                       
                }
else if (tag === 2) {
                    obj.id = pbf.readVarint(true)
                       
                }
else if (tag === 3) {
                    obj.email = pbf.readString()
                       
                }
else if (tag === 6) {
                    obj.bf = pbf.readBytes()
                       
                }
else if (tag === 7) {
                    const entry = Person._FieldEntry7.read(pbf, pbf.readVarint() + pbf.pos); 
                 obj.projects[entry.key] = entry.value;
                       
                }
else if (tag === 8) {
                    obj.helloEnum = pbf.readVarint()
                       
                }
else if (tag === 9) {
                    obj.ipC = f1_f1_c.F1CM._read(pbf, pbf.readVarint() + pbf.pos)
                       
                }
else if (tag === 10) {
                    obj.mapEnum = pbf.readVarint()
                       
                }
else if (tag === 4) {
                    obj.phones.push(AddressBookSerializers.Person.PhoneNumber._read(pbf, pbf.readVarint() + pbf.pos));
                       
                }
else if (tag === 5) {
                    obj.last_updated = f1.Hello._read(pbf, pbf.readVarint() + pbf.pos)
                       
                }
else if (tag === 11) {
                    obj.mapMessage = AddressBookSerializers.Person.PhoneNumber._read(pbf, pbf.readVarint() + pbf.pos)
                       
                }
else if (tag === 12) {
                    obj.mapOneOfMessage = AddressBookSerializers.Person.SampleMessage._read(pbf, pbf.readVarint() + pbf.pos)
                       
                }
else if (tag === 13) {
                    obj.oneofMessageField = AddressBookSerializers.Person.SampleMessage._read(pbf, pbf.readVarint() + pbf.pos)
                       
                }
         }
         static _read(pbf:any,end?:any):addressBook_types.Person {
            return pbf.readFields(this._readField, {name:"",id:0,email:"",bf:null,projects:{},helloEnum:0,ipC:undefined,mapEnum:0,phones:[],last_updated:undefined,mapMessage:undefined,mapOneOfMessage:undefined,oneofMessageField:undefined}, end) as any;
         }

         static deserialize(buffer:Uint8Array):addressBook_types.Person {
             const pbf = new Pbf(buffer)
             return this._read(pbf)
         }
          
         static serialize(obj:addressBook_types.Person) {
             const pbf = new Pbf()
             this._write(obj,pbf)
             return pbf.finish()
         }


         static _write(obj:addressBook_types.Person,pbf:any) {
             if (obj.name) pbf.writeStringField(1, obj.name);
if (obj.id) pbf.writeVarintField(2, obj.id);
if (obj.email) pbf.writeStringField(3, obj.email);
if (obj.bf) pbf.writeBytesField(6, obj.bf);
if (obj.projects) for (let i in obj.projects) if (Object.prototype.hasOwnProperty.call(obj.projects, i)) pbf.writeMessage(35, Person._FieldEntry7.write, { key: i, value: obj.projects[i] });;
if (obj.helloEnum) pbf.writeVarintField(8, obj.helloEnum);
if (obj.ipC) pbf.writeMessage(9, f1_f1_c.F1CM._write, obj.ipC);;
if (obj.mapEnum) pbf.writeVarintField(10, obj.mapEnum);
if (obj.phones) for (let i = 0; i < obj.phones.length; i++) pbf.writeMessage(4, AddressBookSerializers.Person.PhoneNumber._write, obj.phones[i]);;
if (obj.last_updated) pbf.writeMessage(5, f1.Hello._write, obj.last_updated);;
if (obj.mapMessage) pbf.writeMessage(11, AddressBookSerializers.Person.PhoneNumber._write, obj.mapMessage);;
if (obj.mapOneOfMessage) pbf.writeMessage(12, AddressBookSerializers.Person.SampleMessage._write, obj.mapOneOfMessage);;
if (obj.oneofMessageField) pbf.writeMessage(13, AddressBookSerializers.Person.SampleMessage._write, obj.oneofMessageField);;
         }
      }
    
static AddressBook = class AddressBook {
         

         private static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 1) {
                    obj.people.push(AddressBookSerializers.Person._read(pbf, pbf.readVarint() + pbf.pos));
                       
                }
         }
         static _read(pbf:any,end?:any):addressBook_types.AddressBook {
            return pbf.readFields(this._readField, {people:[]}, end) as any;
         }

         static deserialize(buffer:Uint8Array):addressBook_types.AddressBook {
             const pbf = new Pbf(buffer)
             return this._read(pbf)
         }
          
         static serialize(obj:addressBook_types.AddressBook) {
             const pbf = new Pbf()
             this._write(obj,pbf)
             return pbf.finish()
         }


         static _write(obj:addressBook_types.AddressBook,pbf:any) {
             if (obj.people) for (let i = 0; i < obj.people.length; i++) pbf.writeMessage(1, AddressBookSerializers.Person._write, obj.people[i]);;
         }
      }
    
static HelloRequest = class HelloRequest {
         

         private static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 1) {
                    obj.name = pbf.readString()
                       
                }
         }
         static _read(pbf:any,end?:any):addressBook_types.HelloRequest {
            return pbf.readFields(this._readField, {name:""}, end) as any;
         }

         static deserialize(buffer:Uint8Array):addressBook_types.HelloRequest {
             const pbf = new Pbf(buffer)
             return this._read(pbf)
         }
          
         static serialize(obj:addressBook_types.HelloRequest) {
             const pbf = new Pbf()
             this._write(obj,pbf)
             return pbf.finish()
         }


         static _write(obj:addressBook_types.HelloRequest,pbf:any) {
             if (obj.name) pbf.writeStringField(1, obj.name);
         }
      }
    
static RepeatHelloRequest = class RepeatHelloRequest {
         

         private static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 1) {
                    obj.name = pbf.readString()
                       
                }
else if (tag === 2) {
                    obj.count = pbf.readVarint(true)
                       
                }
         }
         static _read(pbf:any,end?:any):addressBook_types.RepeatHelloRequest {
            return pbf.readFields(this._readField, {name:"",count:0}, end) as any;
         }

         static deserialize(buffer:Uint8Array):addressBook_types.RepeatHelloRequest {
             const pbf = new Pbf(buffer)
             return this._read(pbf)
         }
          
         static serialize(obj:addressBook_types.RepeatHelloRequest) {
             const pbf = new Pbf()
             this._write(obj,pbf)
             return pbf.finish()
         }


         static _write(obj:addressBook_types.RepeatHelloRequest,pbf:any) {
             if (obj.name) pbf.writeStringField(1, obj.name);
if (obj.count) pbf.writeVarintField(2, obj.count);
         }
      }
    
static HelloReply = class HelloReply {
         

         private static _readField(tag:number,obj:any,pbf:any) {
            if (tag === 1) {
                    obj.message = pbf.readString()
                       
                }
         }
         static _read(pbf:any,end?:any):addressBook_types.HelloReply {
            return pbf.readFields(this._readField, {message:""}, end) as any;
         }

         static deserialize(buffer:Uint8Array):addressBook_types.HelloReply {
             const pbf = new Pbf(buffer)
             return this._read(pbf)
         }
          
         static serialize(obj:addressBook_types.HelloReply) {
             const pbf = new Pbf()
             this._write(obj,pbf)
             return pbf.finish()
         }


         static _write(obj:addressBook_types.HelloReply,pbf:any) {
             if (obj.message) pbf.writeStringField(1, obj.message);
         }
      }
    
      } 
      export default AddressBookSerializers
    