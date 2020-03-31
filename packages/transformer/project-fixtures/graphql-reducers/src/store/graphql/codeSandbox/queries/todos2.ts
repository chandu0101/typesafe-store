

import { csb } from "../csb-tag"

console.log("test ii")

const tTFrag = csb`
  fragment tTFrag on Todo {
      text
  }
`


const getTodos = csb`
  ${tTFrag}
  query getTodo1 {
      todo {
          text,
          ...tTFrag
      }
  }
`
