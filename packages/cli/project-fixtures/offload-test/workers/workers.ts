
        //TODO onmessage 

        function _getPropsAccess(obj: any, propAccess: string): any => {
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

          
      function SampleReducer_changeBookName(_input:any) {
         const _trg_satate = _input._trg_satate
         const {name} = _input.payload;
         
                   new Array(10000000).fill(undefined).forEach((v ,i) => {
                       
                  if(_tr_book.name.length > i) {  
                        const r = Math.random()
                    }
                
                    })
                
_trg_satate.book.name = name
_trg_satate.book2.b1.name = "2"
         return _getValuesFromState(_trg_satate,_input.propAccessArray)
      }
    
        