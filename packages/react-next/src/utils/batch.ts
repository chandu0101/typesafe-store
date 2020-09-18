// Default to a dummy "batch" implementation that just runs the callback
function defaultNoopBatch(callback: () => any) {
    callback()
}

let batch = defaultNoopBatch

// Allow injecting another batching function later
export const setBatch = (newBatch: () => any) => (batch = newBatch)

// Supply a getter just to skip dealing with ESM bindings
export const getBatch = () => batch