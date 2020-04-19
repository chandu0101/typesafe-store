// package: tutorial
// file: address.proto

import * as jspb from "google-protobuf";
import * as f1_f1types_pb from "./f1/f1types_pb";

export class Person extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getId(): number;
  setId(value: number): void;

  getEmail(): string;
  setEmail(value: string): void;

  getBf(): Uint8Array | string;
  getBf_asU8(): Uint8Array;
  getBf_asB64(): string;
  setBf(value: Uint8Array | string): void;

  getProjectsMap(): jspb.Map<string, string>;
  clearProjectsMap(): void;
  getHelloenum(): f1_f1types_pb.HelloEnumMap[keyof f1_f1types_pb.HelloEnumMap];
  setHelloenum(value: f1_f1types_pb.HelloEnumMap[keyof f1_f1types_pb.HelloEnumMap]): void;

  hasIpc(): boolean;
  clearIpc(): void;
  getIpc(): f1_f1_c_f1ctypes_pb.F1CM | undefined;
  setIpc(value?: f1_f1_c_f1ctypes_pb.F1CM): void;

  clearPhonesList(): void;
  getPhonesList(): Array<Person.PhoneNumber>;
  setPhonesList(value: Array<Person.PhoneNumber>): void;
  addPhones(value?: Person.PhoneNumber, index?: number): Person.PhoneNumber;

  hasLastUpdated(): boolean;
  clearLastUpdated(): void;
  getLastUpdated(): f1_f1types_pb.Hello | undefined;
  setLastUpdated(value?: f1_f1types_pb.Hello): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Person.AsObject;
  static toObject(includeInstance: boolean, msg: Person): Person.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Person, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Person;
  static deserializeBinaryFromReader(message: Person, reader: jspb.BinaryReader): Person;
}

export namespace Person {
  export type AsObject = {
    name: string,
    id: number,
    email: string,
    bf: Uint8Array | string,
    projectsMap: Array<[string, string]>,
    helloenum: f1_f1types_pb.HelloEnumMap[keyof f1_f1types_pb.HelloEnumMap],
    ipc?: f1_f1_c_f1ctypes_pb.F1CM.AsObject,
    phonesList: Array<Person.PhoneNumber.AsObject>,
    lastUpdated?: f1_f1types_pb.Hello.AsObject,
  }

  export class PhoneNumber extends jspb.Message {
    getNumber(): string;
    setNumber(value: string): void;

    getType(): Person.PhoneTypeMap[keyof Person.PhoneTypeMap];
    setType(value: Person.PhoneTypeMap[keyof Person.PhoneTypeMap]): void;

    hasNumber2(): boolean;
    clearNumber2(): void;
    getNumber2(): Person.PhoneNumber.PhoneNumber2 | undefined;
    setNumber2(value?: Person.PhoneNumber.PhoneNumber2): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PhoneNumber.AsObject;
    static toObject(includeInstance: boolean, msg: PhoneNumber): PhoneNumber.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PhoneNumber, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PhoneNumber;
    static deserializeBinaryFromReader(message: PhoneNumber, reader: jspb.BinaryReader): PhoneNumber;
  }

  export namespace PhoneNumber {
    export type AsObject = {
      number: string,
      type: Person.PhoneTypeMap[keyof Person.PhoneTypeMap],
      number2?: Person.PhoneNumber.PhoneNumber2.AsObject,
    }

    export class PhoneNumber2 extends jspb.Message {
      getNumber2(): string;
      setNumber2(value: string): void;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): PhoneNumber2.AsObject;
      static toObject(includeInstance: boolean, msg: PhoneNumber2): PhoneNumber2.AsObject;
      static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
      static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
      static serializeBinaryToWriter(message: PhoneNumber2, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): PhoneNumber2;
      static deserializeBinaryFromReader(message: PhoneNumber2, reader: jspb.BinaryReader): PhoneNumber2;
    }

    export namespace PhoneNumber2 {
      export type AsObject = {
        number2: string,
      }
    }
  }

  export interface PhoneTypeMap {
    MOBILE: 0;
    HOME: 1;
    WORK: 2;
  }

  export const PhoneType: PhoneTypeMap;
}

export class AddressBook extends jspb.Message {
  clearPeopleList(): void;
  getPeopleList(): Array<Person>;
  setPeopleList(value: Array<Person>): void;
  addPeople(value?: Person, index?: number): Person;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddressBook.AsObject;
  static toObject(includeInstance: boolean, msg: AddressBook): AddressBook.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AddressBook, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AddressBook;
  static deserializeBinaryFromReader(message: AddressBook, reader: jspb.BinaryReader): AddressBook;
}

export namespace AddressBook {
  export type AsObject = {
    peopleList: Array<Person.AsObject>,
  }
}

export class HelloRequest extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HelloRequest.AsObject;
  static toObject(includeInstance: boolean, msg: HelloRequest): HelloRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HelloRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HelloRequest;
  static deserializeBinaryFromReader(message: HelloRequest, reader: jspb.BinaryReader): HelloRequest;
}

export namespace HelloRequest {
  export type AsObject = {
    name: string,
  }
}

export class RepeatHelloRequest extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getCount(): number;
  setCount(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RepeatHelloRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RepeatHelloRequest): RepeatHelloRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RepeatHelloRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RepeatHelloRequest;
  static deserializeBinaryFromReader(message: RepeatHelloRequest, reader: jspb.BinaryReader): RepeatHelloRequest;
}

export namespace RepeatHelloRequest {
  export type AsObject = {
    name: string,
    count: number,
  }
}

export class HelloReply extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): HelloReply.AsObject;
  static toObject(includeInstance: boolean, msg: HelloReply): HelloReply.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: HelloReply, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HelloReply;
  static deserializeBinaryFromReader(message: HelloReply, reader: jspb.BinaryReader): HelloReply;
}

export namespace HelloReply {
  export type AsObject = {
    message: string,
  }
}

export interface PhoneType2Map {
  MOBILE: 0;
  HOME: 1;
  WORK: 2;
}

export const PhoneType2: PhoneType2Map;

