import * as jspb from "google-protobuf"

import * as f1_f1types_pb from './f1/f1types_pb';

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

  getHelloenum(): f1_f1types_pb.HelloEnum;
  setHelloenum(value: f1_f1types_pb.HelloEnum): void;

  getIpc(): f1_f1_c_f1ctypes_pb.F1CM | undefined;
  setIpc(value?: f1_f1_c_f1ctypes_pb.F1CM): void;
  hasIpc(): boolean;
  clearIpc(): void;

  getMapenumMap(): jspb.Map<string, f1_f1types_pb.HelloEnum>;
  clearMapenumMap(): void;

  getPhonesList(): Array<Person.PhoneNumber>;
  setPhonesList(value: Array<Person.PhoneNumber>): void;
  clearPhonesList(): void;
  addPhones(value?: Person.PhoneNumber, index?: number): Person.PhoneNumber;

  getLastUpdated(): f1_f1types_pb.Hello | undefined;
  setLastUpdated(value?: f1_f1types_pb.Hello): void;
  hasLastUpdated(): boolean;
  clearLastUpdated(): void;

  getMapmessageMap(): jspb.Map<string, Person.PhoneNumber>;
  clearMapmessageMap(): void;

  getMaponeofmessageMap(): jspb.Map<string, Person.SampleMessage>;
  clearMaponeofmessageMap(): void;

  getOneofmessagefield(): Person.SampleMessage | undefined;
  setOneofmessagefield(value?: Person.SampleMessage): void;
  hasOneofmessagefield(): boolean;
  clearOneofmessagefield(): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Person.AsObject;
  static toObject(includeInstance: boolean, msg: Person): Person.AsObject;
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
    helloenum: f1_f1types_pb.HelloEnum,
    ipc?: f1_f1_c_f1ctypes_pb.F1CM.AsObject,
    mapenumMap: Array<[string, f1_f1types_pb.HelloEnum]>,
    phonesList: Array<Person.PhoneNumber.AsObject>,
    lastUpdated?: f1_f1types_pb.Hello.AsObject,
    mapmessageMap: Array<[string, Person.PhoneNumber.AsObject]>,
    maponeofmessageMap: Array<[string, Person.SampleMessage.AsObject]>,
    oneofmessagefield?: Person.SampleMessage.AsObject,
  }

  export class PhoneNumber extends jspb.Message {
    getNumber(): string;
    setNumber(value: string): void;

    getType(): Person.PhoneType;
    setType(value: Person.PhoneType): void;

    getNumber2(): Person.PhoneNumber.PhoneNumber2 | undefined;
    setNumber2(value?: Person.PhoneNumber.PhoneNumber2): void;
    hasNumber2(): boolean;
    clearNumber2(): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PhoneNumber.AsObject;
    static toObject(includeInstance: boolean, msg: PhoneNumber): PhoneNumber.AsObject;
    static serializeBinaryToWriter(message: PhoneNumber, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PhoneNumber;
    static deserializeBinaryFromReader(message: PhoneNumber, reader: jspb.BinaryReader): PhoneNumber;
  }

  export namespace PhoneNumber {
    export type AsObject = {
      number: string,
      type: Person.PhoneType,
      number2?: Person.PhoneNumber.PhoneNumber2.AsObject,
    }

    export class PhoneNumber2 extends jspb.Message {
      getNumber2(): string;
      setNumber2(value: string): void;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): PhoneNumber2.AsObject;
      static toObject(includeInstance: boolean, msg: PhoneNumber2): PhoneNumber2.AsObject;
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


  export class SampleMessage extends jspb.Message {
    getName(): string;
    setName(value: string): void;

    getSubMessage(): Person.PhoneNumber | undefined;
    setSubMessage(value?: Person.PhoneNumber): void;
    hasSubMessage(): boolean;
    clearSubMessage(): void;

    getTestOneofCase(): SampleMessage.TestOneofCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SampleMessage.AsObject;
    static toObject(includeInstance: boolean, msg: SampleMessage): SampleMessage.AsObject;
    static serializeBinaryToWriter(message: SampleMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SampleMessage;
    static deserializeBinaryFromReader(message: SampleMessage, reader: jspb.BinaryReader): SampleMessage;
  }

  export namespace SampleMessage {
    export type AsObject = {
      name: string,
      subMessage?: Person.PhoneNumber.AsObject,
    }

    export enum TestOneofCase { 
      TEST_ONEOF_NOT_SET = 0,
      NAME = 4,
      SUB_MESSAGE = 9,
    }
  }


  export enum PhoneType { 
    MOBILE = 0,
    HOME = 1,
    WORK = 2,
  }
}

export class AddressBook extends jspb.Message {
  getPeopleList(): Array<Person>;
  setPeopleList(value: Array<Person>): void;
  clearPeopleList(): void;
  addPeople(value?: Person, index?: number): Person;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddressBook.AsObject;
  static toObject(includeInstance: boolean, msg: AddressBook): AddressBook.AsObject;
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
  static serializeBinaryToWriter(message: HelloReply, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): HelloReply;
  static deserializeBinaryFromReader(message: HelloReply, reader: jspb.BinaryReader): HelloReply;
}

export namespace HelloReply {
  export type AsObject = {
    message: string,
  }
}

export enum PhoneType2 { 
  MOBILE = 0,
  HOME = 1,
  WORK = 2,
}
