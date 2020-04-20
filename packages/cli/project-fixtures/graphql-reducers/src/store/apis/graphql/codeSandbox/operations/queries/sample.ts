import csb from "../../csb";



const q1 = csb`
query one {
    todo {
      text
    }
  }
`

const mq1 = csb`
query one {
    todo {
      text
    }
  }
  
  query two {
    todo {
      text
    }
  }

`
