import Provider from './components/Provider'

import useSelector from './hooks/useSelector'
import useSelectorSuspense from "./hooks/useSelectorSuspense"
import useDispatch from './hooks/useDispatch'
import useStore from './hooks/useStore'
import { useIsomorphicLayoutEffect } from "./utils/useIsomorphicLayoutEffect"
// import { setBatch } from './utils/batch'
// import { unstable_batchedUpdates as batch } from './utils/reactBatchUpdates'

// setBatch(batch as any)

export {
  Provider,
  // batch,
  useSelector,
  useSelectorSuspense,
  useStore,
  useDispatch,
  useIsomorphicLayoutEffect
}