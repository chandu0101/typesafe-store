
           // this file is auto generated on 2020-04-02T05:24:32.396Z, don't modify it
           import {Selector} from "@typesafe-store/store"
           import { createSelector } from "@typesafe-store/store"
export type State = {
    obj1: {
        name: string;
        values: string[];
    };
    obj2: {
        text: {
            l: number;
            l1: {
                one: {
                    s: string;
                };
            };
            l2: {
                name: string;
            };
        };
    };
};
const s = "36";
export const s1:Selector<State,string> = {fn:(s: State) => {
    const o1 = s.obj1
    const o2 = s.obj2.text.l
    const o3 = s.obj2.text.l1.one
    const o4l2 = s.obj2.text.l2
    const l2n = o4l2.name
    const n = o1.name
    const n1 = n.length
    return "hello"
},dependencies:{"obj1":["name"],"obj2":["text.l","text.l1.one","text.l2.name"]}}
export const s2:Selector<State,void> = {fn:({ obj1, obj2 }: State) => {

},dependencies:{"obj1":[],"obj2":[]}}

          