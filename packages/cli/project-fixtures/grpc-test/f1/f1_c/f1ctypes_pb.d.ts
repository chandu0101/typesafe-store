import * as jspb from "google-protobuf"

export class F1CM extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): F1CM.AsObject;
  static toObject(includeInstance: boolean, msg: F1CM): F1CM.AsObject;
  static serializeBinaryToWriter(message: F1CM, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): F1CM;
  static deserializeBinaryFromReader(message: F1CM, reader: jspb.BinaryReader): F1CM;
}

export namespace F1CM {
  export type AsObject = {
    name: string,
  }
}

