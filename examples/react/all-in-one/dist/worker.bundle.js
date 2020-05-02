/******/ (function (modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if (installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
            /******/
        }
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
            /******/
        };
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
        /******/
    }
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function (exports, name, getter) {
/******/ 		if (!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
            /******/
        }
        /******/
    };
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function (exports) {
/******/ 		if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
            /******/
        }
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
        /******/
    };
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function (value, mode) {
/******/ 		if (mode & 1) value = __webpack_require__(value);
/******/ 		if (mode & 8) return value;
/******/ 		if ((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if (mode & 2 && typeof value != 'string') for (var key in value) __webpack_require__.d(ns, key, function (key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
        /******/
    };
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function (module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
        /******/
    };
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function (object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./workers/worker.ts");
    /******/
})
/************************************************************************/
/******/({

/***/ "./workers/worker.ts":
/*!***************************!*\
  !*** ./workers/worker.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function (module, exports, __webpack_require__) {

            "use strict";

            var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
                function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
                return new (P || (P = Promise))(function (resolve, reject) {
                    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
                    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
                    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
                    step((generator = generator.apply(thisArg, _arguments || [])).next());
                });
            };
            Object.defineProperty(exports, "__esModule", { value: true });
            onmessage = (e) => __awaiter(void 0, void 0, void 0, function* () {
                const wi = e.data;
                console.log("onmessage", e);
                try {
                    if (wi.kind == "WorkerAbort") {
                        console.log("Worker got abort message ");
                        const abc = self.globalAbortController;
                        if (abc) {
                            abc.abort();
                        }
                    }
                    else if (wi.kind === "Fetch") {
                        let m = { kind: wi.kind, status: "Processing" };
                        postMessage(m);
                        yield _processFetch(wi.input);
                    }
                    else if (wi.kind === "Sync") {
                        let m = { kind: wi.kind, status: "Processing" };
                        postMessage(m);
                        _processSync(wi.input);
                    }
                }
                catch (error) {
                    const erm = { kind: wi.kind, error, status: "Error" };
                    postMessage(erm);
                }
                finally {
                    self.globalAbortController = null;
                }
            });
            function _processFetch(_input) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { url, options, responseType, abortable, freq, graphql, grpc, tf } = _input;
                    let res = null;
                    if (abortable) {
                        self.globalAbortController = new AbortController();
                    }
                    try {
                        const gabc = self.globalAbortController;
                        if (gabc) {
                            options.signal = gabc.signal;
                        }
                        res = yield fetch(url, options);
                    }
                    catch (error) {
                        self.globalAbortController = null;
                        const resultError = { error, completed: true };
                        const wo = { kind: "Fetch", status: "Success", rejectionError: true, stream: true, result: resultError };
                        postMessage(wo);
                        return;
                    }
                    self.globalAbortController = null;
                    console.log("*************** Resp : ", res.ok, res.status);
                    if (!res.ok) {
                        const errorResult = { error: res.statusText, completed: true };
                        const wo = { kind: "Fetch", status: "Success", stream: true, result: errorResult };
                        postMessage(wo);
                    }
                    else {
                        const processStream = (reader) => __awaiter(this, void 0, void 0, function* () {
                            const result = yield reader.read();
                            if (result.done) {
                                const resultSuccess = { completed: true };
                                const wo = { kind: "Fetch", status: "Success", stream: true, result: resultSuccess };
                                postMessage(wo);
                                return;
                            }
                            else {
                                let v = result.value;
                                if (grpc) {
                                    const gv = self["_grpc_chunk_parser"](v);
                                    if (gv) {
                                        const dsd = self[grpc.dsf](gv);
                                        const rdata = tf ? self[tf](dsd, freq) : dsd;
                                        const resultSuccess = { data: rdata };
                                        const wo = { kind: "Fetch", status: "Processing", stream: true, result: resultSuccess };
                                        postMessage(wo);
                                    }
                                }
                                else {
                                    const rdata = tf ? self[tf](v, freq) : v;
                                    const resultSuccess = { data: rdata };
                                    const wo = { kind: "Fetch", status: "Processing", stream: true, result: resultSuccess };
                                    postMessage(wo);
                                }
                                return processStream(reader);
                            }
                        });
                        if (responseType === "stream") {
                            processStream(res.body.getReader());
                        }
                        else {
                            let response = undefined;
                            if (responseType === "json") {
                                response = yield res.json();
                            }
                            else if (responseType === "blob") {
                                response = yield res.blob();
                            }
                            else if (responseType === "arrayBuffer") {
                                response = yield res.arrayBuffer();
                            }
                            else if (responseType === "text") {
                                response = yield res.text();
                            }
                            if (graphql) {
                                if (graphql.multiOp) {
                                    const resp = response;
                                    let allErrors = true;
                                    let datas = [];
                                    const errorsArr = [];
                                    resp.forEach(v => {
                                        if (v.data) {
                                            allErrors = false;
                                            datas.push(v.data);
                                            errorsArr.push(v.errors || []);
                                        }
                                        else {
                                            datas.push(null);
                                            errorsArr.push(v.error.erros);
                                        }
                                    });
                                    const resultSuccess = { data: datas, error: errorsArr, completed: true };
                                    const wo = { kind: "Fetch", status: "Success", result: resultSuccess };
                                    postMessage(wo);
                                }
                                else {
                                    if (response.data) {
                                        let rdata = response.data;
                                        let successResult = {
                                            data: rdata,
                                            error: response.errors,
                                            completed: true
                                        };
                                        const wo = { kind: "Fetch", status: "Success", result: successResult };
                                        postMessage(wo);
                                    }
                                    else {
                                        const errorResult = { error: response.error.errors, completed: true };
                                        const wo = { kind: "Fetch", status: "Success", result: errorResult };
                                        postMessage(wo);
                                    }
                                }
                            }
                            else {
                                if (grpc) {
                                    const newBytes = self["_grpc_chunk_parser"](response);
                                    if (newBytes) {
                                        response = self[grpc.dsf](newBytes);
                                        if (tf) {
                                            response = self[tf](response, freq);
                                        }
                                    }
                                    else {
                                        response = null;
                                    }
                                }
                                else {
                                    if (tf) {
                                        response = self[tf](response, freq);
                                    }
                                }
                                const resultSuccess = { data: response, completed: true };
                                const wo = { kind: "Fetch", status: "Success", result: resultSuccess };
                                postMessage(wo);
                            }
                        }
                    }
                });
            }
            function _getPropsAccess(obj, propAccess) {
                let result = obj;
                propAccess.split(".").some(v => {
                    const pav = result[v];
                    if (pav) {
                        result = pav;
                    }
                    else {
                        result = pav;
                        return true;
                    }
                });
                return result;
            }
            function _getValuesFromState(obj, propAccessArray) {
                const result = {};
                propAccessArray.forEach(pa => {
                    result[pa] = _getPropsAccess(obj, pa);
                });
                return result;
            }
            function _processSync(_input) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { workerFunction, state, abortable, propAccessArray, payload } = _input;
                    if (!abortable) {
                        const v = self[workerFunction]({ _trg_satate: state, payload: payload, propAccessArray: propAccessArray });
                        const wo = { kind: "Sync", status: "Success", result: v };
                        postMessage(wo);
                        return;
                    }
                    self.globalAbortController = new AbortController();
                    yield new Promise((resolve) => {
                        const abc = self.globalAbortController;
                        abc.signal.addEventListener("abort", () => {
                            console.log("Worker handleAbort _processSync", abc);
                            const wo = { kind: "Sync", status: "Success", abortError: new Error("aborted by user"), result: null };
                            postMessage(wo);
                            resolve();
                        });
                        const v = self[workerFunction]({ _trg_satate: state, payload: payload, propAccessArray: propAccessArray });
                        const wo = { kind: "Sync", status: "Success", result: v };
                        postMessage(wo);
                        resolve();
                    });
                });
            }
            self["SyncReducer_calculateFactorialOffload"] = (_input) => {
                const _trg_satate = _input._trg_satate;
                const { n } = _input.payload;
                let ans = 1;
                for (let i = 2; i <= n; i++) {
                    ans = ans * i;
                }
                _trg_satate.factorialOffload = ans;
                return _getValuesFromState(_trg_satate, _input.propAccessArray);
            };


            /***/
        })

    /******/
});
//# sourceMappingURL=worker.bundle.js.map