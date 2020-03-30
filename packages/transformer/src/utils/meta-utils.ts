import { TypeSafeStoreConfigExtra, TsBuildInfo } from "../types"
import * as ts from "typescript"


export class MetaUtils {

    static setUpMeta() {
        global.tStoreMeta = {
            graphqlApis: new Map(),
            restApis: new Map(),
            reducers: new Map(),
            config: null as any,
            program: null as any
        }
    }

    static setTempTsBuildInfo(buildInfo: TsBuildInfo) {
        global.tStoreMeta.tempBuildInfo = buildInfo
    }

    static getTempTsBuildInfo() {
        return global.tStoreMeta.tempBuildInfo
    }

    static setConfig(config: TypeSafeStoreConfigExtra) {
        global.tStoreMeta.config = config
    }

    static getConfig() {
        return global.tStoreMeta.config
    }

    static setProgram(program: ts.Program) {
        global.tStoreMeta.program = program
    }

    static getProgram() {
        return global.tStoreMeta.program
    }

    static getGraphqlMeta() {
        return global.tStoreMeta.graphqlApis
    }

}