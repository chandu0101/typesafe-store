

function prop(obj: Object, key: string, value: any) {
    Object.defineProperty(obj, key, { value })
}

let COUNT = 0;

type TaskQueueOptions = { size: number }


export default class TaskQueue {

    id = 0;
    $$pool!: TaskQueuePool
    constructor({ size }: TaskQueueOptions = { size: 1 }) {
        prop(this, "$$pool", new TaskQueuePool({ size }))
    }

    postTask(taskName: string, ...args: any[]) {
        const task = new Task();
        this.id = ++COUNT
        this.$$pool.exec(task, taskName, args)
    }

    addModule(moduleURL: string, ) {
        return fetch(moduleURL).then((r) => r.text())
            .then((code) => {
                this.$$pool.addWorklet(code)
            })
    }

}

const workerUrl = URL.createObjectURL(new Blob(['(' + (() => {

    const window = { CP: { shouldStopExecution: () => false, exitedLoop() { } } }

    function realm(code: string, scope: any) {
        scope.eval = self.eval;
        scope.self = scope;
        const keys = Object.keys(scope)
        return self.eval(`function(${keys},scope,code,keys,realm){\n${code}\n})`).apply(scope, keys.map((k) => scope[k]))
    }
    (() => {

        let SPECIAL = ""
        const results: any = {}
        function walk(obj: any, action: any) {
            const sentinel = SPECIAL + ":"
            walkReduce(obj, (acc: any, value: any, i: any, obj: any) => {
                if (typeof value === "object" && value && "taskIdentifier" in value && value.$$taskIdentifier === sentinel + value.id) {
                    action(value, i, obj)
                }
            })
        }

        function walkReduce(obj: any, reducer: any, accumulator?: any, index?: any, parent?: any) {
            const f = reducer(accumulator, obj, index, parent)
            if (f !== undefined) {
                accumulator = f;
            }
            if (typeof obj === "object" && obj) {
                for (let i in obj) {
                    walkReduce(obj[i], reducer, accumulator, i, obj)
                }
            }
            return accumulator;
        }

        function collectTransferrables(xfer: any, value: any) {
            if ((value instanceof ArrayBuffer) ||
                (value instanceof MessagePort) ||
                (value instanceof ImageBitmap)
            ) {
                xfer.push(value)
            }
        }

        function countPendingTasks(task: any, property: string, obj: any) {
            if ("$$taskResult" in task) return;
            const result = results[task.id]
        }

        function replaceTaskIdWitgResult(task: any, property: string, obj: any) {
            let value;
            if ("$$taskResult" in task) {
                value = task.$$taskResult;
            } else {
                const result = results[task.id]
                value = result.error || result.value
            }
            obj[property] = value;
        }

    })()

}) + ')()']))

class Task {
    state = "pending"
    constructor() {

    }
}


Object.defineProperties(Task.prototype, {
    $$taskIdentifier: {
        configurable: false,
        enumerable: true,
        writable: true,
    },
    state: {
        writable: true,
        value: "pending"
    },
    result: {
        get() {
            let c = this.$$result;
            if (!c) prop(this, "$$result", c = this.$$queue.$$pool.getResult(this.id));
            return c;
        }
    },
    cancel: {
        value() {
            this.$$queue.$$pool.cancel(this.id)
        }
    }
})



function walkArgs(obj: any, walker: any) {

    for (let i in obj) {
        const value = obj[i]
        if (typeof value === "object" && value) {
            if (value instanceof Task) {
                walker(value, i, obj)
            } else {
                walker(value)
            }
        }
    }
}

type TaskQueuePoolOptions = { size: number }

class TaskQueuePool {

    workers: any[] = []
    worklets: any[] = []
    tasks = {}
    poolSize: number = 1;
    workerTaskAssignments: any = {}

    constructor({ size }: TaskQueuePoolOptions) {
        this.poolSize = size
    }

    exec(task: Task, taskName: string, args: any) {

        const worker = null
    }


    addWorklet(code: any) {
        this.worklets.push(code)
        return Promise.all(this.workers.map(worker => worker.call("eval", [code])))
    }

    getWorker(id: any) {
        for (const worker of this.workers) {
            if (worker.id === id) return worker
        }
    }

    addWorker() {
        // const worker :any = new Worker(workerUrl)
        //     (worker as any).id = ++COUNT
    }

    getWorkerForTask(taskId: any) {
        const id = this.workerTaskAssignments[taskId]
    }

    getTaskDependencies(args: any) {
        const tasks: any[] = []
        walkArgs(args, (value: any) => {
            tasks.push(value)
        })
        return tasks;
    }
    getTaskWorker(taskName: string, args: any) {
        // const tasks = getTas
        const tasks = this.getTaskDependencies(args)
        const usage: any = {}
        let highest = 0;
        let best;
        for (const task of tasks) {
            const workerId = this.workerTaskAssignments[task.id]
            let c = usage[workerId] = (usage[workerId] || 0) + 1;
            if (c > highest) {
                highest = c;
                best = workerId
            }
            if (best != null) return this.getWorker(best)
        }
    }

    getNextWorker() {
        const size = this.workers.length
        if (size === 0) return this.addWorker()
        let best = this.workers[0]
        for (let i = 1; i < size; i++) {
            const worker = this.workers[i]
            if (worker.pending < best.pending) {
                best = worker
            }
        }
        if (best.pending && size < this.poolSize) {
            return this.addWorker()
        }
        return best;
    }
}