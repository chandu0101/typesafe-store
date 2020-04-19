/**
 * @fileoverview gRPC-Web generated client stub for tutorial
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


import * as grpcWeb from 'grpc-web';

import * as f1_f1types_pb from './f1/f1types_pb';

import {
  HelloReply,
  HelloRequest,
  RepeatHelloRequest} from './address_pb';

export class GreeterClient {
  client_: grpcWeb.AbstractClientBase;
  hostname_: string;
  credentials_: null | { [index: string]: string; };
  options_: null | { [index: string]: string; };

  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; }) {
    if (!options) options = {};
    if (!credentials) credentials = {};
    options['format'] = 'text';

    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname;
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodInfoSayHello = new grpcWeb.AbstractClientBase.MethodInfo(
    HelloReply,
    (request: HelloRequest) => {
      return request.serializeBinary();
    },
    HelloReply.deserializeBinary
  );

  sayHello(
    request: HelloRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: HelloReply) => void) {
    return this.client_.rpcCall(
      this.hostname_ +
        '/tutorial.Greeter/SayHello',
      request,
      metadata || {},
      this.methodInfoSayHello,
      callback);
  }

  methodInfoSayRepeatHello = new grpcWeb.AbstractClientBase.MethodInfo(
    HelloReply,
    (request: RepeatHelloRequest) => {
      return request.serializeBinary();
    },
    HelloReply.deserializeBinary
  );

  sayRepeatHello(
    request: RepeatHelloRequest,
    metadata?: grpcWeb.Metadata) {
    return this.client_.serverStreaming(
      this.hostname_ +
        '/tutorial.Greeter/SayRepeatHello',
      request,
      metadata || {},
      this.methodInfoSayRepeatHello);
  }

  methodInfoSayHelloAfterDelay = new grpcWeb.AbstractClientBase.MethodInfo(
    HelloReply,
    (request: HelloRequest) => {
      return request.serializeBinary();
    },
    HelloReply.deserializeBinary
  );

  sayHelloAfterDelay(
    request: HelloRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: HelloReply) => void) {
    return this.client_.rpcCall(
      this.hostname_ +
        '/tutorial.Greeter/SayHelloAfterDelay',
      request,
      metadata || {},
      this.methodInfoSayHelloAfterDelay,
      callback);
  }

}

export class Greeter2Client {
  client_: grpcWeb.AbstractClientBase;
  hostname_: string;
  credentials_: null | { [index: string]: string; };
  options_: null | { [index: string]: string; };

  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: string; }) {
    if (!options) options = {};
    if (!credentials) credentials = {};
    options['format'] = 'text';

    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname;
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodInfoSayHello2 = new grpcWeb.AbstractClientBase.MethodInfo(
    HelloReply,
    (request: HelloRequest) => {
      return request.serializeBinary();
    },
    HelloReply.deserializeBinary
  );

  sayHello2(
    request: HelloRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: HelloReply) => void) {
    return this.client_.rpcCall(
      this.hostname_ +
        '/tutorial.Greeter2/SayHello2',
      request,
      metadata || {},
      this.methodInfoSayHello2,
      callback);
  }

  methodInfoSayRepeatHello2 = new grpcWeb.AbstractClientBase.MethodInfo(
    HelloReply,
    (request: RepeatHelloRequest) => {
      return request.serializeBinary();
    },
    HelloReply.deserializeBinary
  );

  sayRepeatHello2(
    request: RepeatHelloRequest,
    metadata?: grpcWeb.Metadata) {
    return this.client_.serverStreaming(
      this.hostname_ +
        '/tutorial.Greeter2/SayRepeatHello2',
      request,
      metadata || {},
      this.methodInfoSayRepeatHello2);
  }

  methodInfoSayHelloAfterDelay2 = new grpcWeb.AbstractClientBase.MethodInfo(
    HelloReply,
    (request: HelloRequest) => {
      return request.serializeBinary();
    },
    HelloReply.deserializeBinary
  );

  sayHelloAfterDelay2(
    request: HelloRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: HelloReply) => void) {
    return this.client_.rpcCall(
      this.hostname_ +
        '/tutorial.Greeter2/SayHelloAfterDelay2',
      request,
      metadata || {},
      this.methodInfoSayHelloAfterDelay2,
      callback);
  }

}

