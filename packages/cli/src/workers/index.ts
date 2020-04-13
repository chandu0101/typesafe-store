import { MetaUtils } from "../utils/meta-utils";
import { WorkerFunction } from "../types";
import { ConfigUtils } from "../utils/config-utils";
import { FileUtils } from "../utils/file-utils";
import { WORKER_STATE_EXTRACTOR_FUNCTION_NAME } from "../constants"

const GET_PROP_ACCESS_FUNCTION_NAME = "_getPropsAccess"

export class WorkersUtils {

    private static getWorkerFunctions() {
        return MetaUtils.getWorkersMeta().fns
    }

    private static setIsChanged(value: boolean) {
        const wm = MetaUtils.getWorkersMeta()
        wm.isChanged = value
    }

    static addWorkerFunction(fn: WorkerFunction) {
        const workerFunctions = this.getWorkerFunctions()

        const isAdded = workerFunctions.some(f => {
            if (f.group === fn.group && f.name === fn.name) {
                f.code = fn.code
                return true
            }
        })
        if (!isAdded) {
            workerFunctions.push(fn)
        }
        this.setIsChanged(true)
    }

    static removeWorkerFunction(name: string, group: string) {
        const workerFunctions = this.getWorkerFunctions()
        let index = - 1
        workerFunctions.some((wf, i) => {
            if (wf.name === name && group === wf.group) {
                index = i;
                return true
            }
        })
        if (index > -1) {
            workerFunctions.splice(index, 1)
            this.setIsChanged(true)
        }

    }

    static createWorkersFile() {
        const wm = MetaUtils.getWorkersMeta()
        console.log("writing worker file ", wm);
        if (!wm.isChanged) return
        const workerFunctions = wm.fns;
        const path = ConfigUtils.getOutputPathForWorkers()
        console.log("path : ", path);
        const fns = workerFunctions.map(f => {
            return f.code
        }).join("\n")
        const output = `
        //TODO onmessage 

        function ${GET_PROP_ACCESS_FUNCTION_NAME}(obj: any, propAccess: string): any  {
            let result: any = obj
            propAccess.split(".").some(v => {
                const pav = result[v]
                if (pav) {
                    result = pav
                } else {
                    result = pav
                    return true
                }
            })
            return result
        }

        function ${WORKER_STATE_EXTRACTOR_FUNCTION_NAME}(obj: any, propAccessArray: string[]) {
            const result: any = {}
            propAccessArray.forEach(pa => {
                result[pa] = _getPropsAccess(obj, pa)
            })
            return result
        }

          ${fns}
        `
        FileUtils.writeFileSync(path, output)
        this.setIsChanged(false)
    }

}


// worker inbuilt code , copy this to final worker output 

function _getPropsAccess(obj: any, propAccess: string): any {
    let result: any = obj
    propAccess.split(".").some(v => {
        const pav = result[v]
        if (pav) {
            result = pav
        } else {
            result = pav
            return true
        }
    })
    return result
}

function _getValuesFromState(obj: any, propAccessArray: string[]) {
    const result: any = {}
    propAccessArray.forEach(pa => {
        result[pa] = _getPropsAccess(obj, pa)
    })
    return result
}