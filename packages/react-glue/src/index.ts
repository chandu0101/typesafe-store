import Provider from './components/Provider'

import useSelector from './hooks/useSelector'
import useSelectorE from './hooks/useSelectorE'
import useDispatch from './hooks/useDispatch'
import useStore from './hooks/useStore'

import { setBatch } from './utils/batch'
import { unstable_batchedUpdates as batch } from './utils/reactBatchUpdates'

setBatch(batch as any)

export {
  Provider,
  batch,
  useSelector,
  useStore,
  useSelectorE,
  useDispatch
}