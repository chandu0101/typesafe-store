import { SampleReducerGroup, SampleState } from "../reducers/generated/Sample";

const shallowCompareExcept = (
  obj1: any,
  obj2: any,
  exceptFields: string[]
): boolean => {
  if (obj1 === obj2) {
    if (exceptFields.length > 0) {
      return false;
    }
    return true;
  }

  for (const key in obj1) {
    const excluded = exceptFields.includes(key);
    if (!excluded && obj1[key] !== obj2[key]) {
      // console.log("Shallow COmapre failing on : ", excluded, obj1[key], obj2[key]);
      return false;
    } else if (excluded && obj1[key] === obj2[key]) {
      // console.log("Shallow COmapre failing on : ", excluded, obj1[key], obj2[key]);
      return false;
    }
  }

  return true;
};

describe("shallowCompareExcept", () => {
  test("should return true on same objects and exceptFields empty", () => {
    const a = { name: "hello" };
    const b = a;
    expect(shallowCompareExcept(a, b, [])).toBeTruthy();
  });

  test("should return true", () => {
    const a = { name: "hello", p: { 1: 2 }, p2: { 3: 1 } };
    const b = { ...a, p: { 2: 3 } };
    expect(shallowCompareExcept(a, b, ["p"])).toBeTruthy();
    const c = { ...a };
    expect(shallowCompareExcept(a, c, [])).toBeTruthy();
  });

  test("should false", () => {
    const a = { name: "hello", p: { 1: 2 }, p2: { 3: 1 } };
    const b = { ...a, p: a.p };
    expect(shallowCompareExcept(a, b, ["p"])).toBeFalsy();
    const c = { ...a, p: {} };
    expect(shallowCompareExcept(a, c, [])).toBeFalsy();
  });
});

describe("Reducer", () => {
  const reducerGroup = SampleReducerGroup;
  const reducer = reducerGroup.r;
  test("should generate reducer function", () => {
    expect(reducer).not.toBeNull();
  });
  let state: SampleState = reducerGroup.ds;

  test("should change name", () => {
    const NEW_NAME = "New Name";

    const prevState = state;
    state = reducer(state, {
      name: "changeName",
      group: "Sample",
      payload: NEW_NAME
    });
    expect(shallowCompareExcept(prevState, state, ["name"])).toBeTruthy();
    expect(state.name).toBe(NEW_NAME);
  });

  test("should increment count", () => {
    const prevState = state;
    state = reducer(state, {
      name: "increment",
      group: "Sample"
    });
    expect(shallowCompareExcept(prevState, state, ["count"])).toBeTruthy();
    expect(state.count).toBe(3);
  });

  test("should modify person", () => {
    let prevState = state;
    state = reducer(state, {
      name: "changePersonName",
      group: "Sample",
      payload: "P1C"
    });
    expect(shallowCompareExcept(prevState, state, ["person"])).toBeTruthy();
    expect(state.person.name).toBe("P1C");
    prevState = state;
    state = reducer(state, {
      name: "changePersonAge",
      group: "Sample",
      payload: 20
    });
    expect(shallowCompareExcept(prevState, state, ["person"])).toBeTruthy();
    expect(state.person.name).toBe("P1C");
    expect(state.person.age).toBe(20);
  });

  test("should push to an array", () => {
    let prevState = state;
    const b = { name: "", year: 3 };
    state = reducer(state, {
      name: "addBooks",
      group: "Sample",
      payload: [b]
    });
    expect(shallowCompareExcept(prevState, state, ["books"])).toBeTruthy();
    expect(prevState.books.concat([b])).toStrictEqual(state.books);
  });

  test("should pop from an array", () => {
    let prevState = state;
    state = reducer(state, { name: "removeLastBook", group: "Sample" });
    expect(shallowCompareExcept(prevState, state, ["books"])).toBeTruthy();
    const pb = [...prevState.books];
    pb.pop();
    expect(pb).toStrictEqual(state.books);
  });

  test("should splice an array", () => {
    let prevState = state;
    const b = { name: "", year: 3 };
    prevState = reducer(state, {
      name: "addBooks",
      group: "Sample",
      payload: [b]
    });
    state = reducer(prevState, { name: "removeLastBook", group: "Sample" });
    expect(shallowCompareExcept(prevState, state, ["books"])).toBeTruthy();
    const pb = [...prevState.books];
    pb.splice(0, 1);
    expect(pb).toStrictEqual(state.books);
  });

  test("should fill an array", () => {
    let prevState = state;
    const b = { name: "", year: 3 };
    prevState = reducer(state, {
      name: "replaceBooks",
      group: "Sample",
      payload: [b]
    });
    const b1 = { name: "b1", year: 1 };
    state = reducer(prevState, {
      name: "fillBookAt0",
      group: "Sample",
      payload: b1
    });
    expect(shallowCompareExcept(prevState, state, ["books"])).toBeTruthy();
    const pb = [...prevState.books];
    pb.fill(b1, 0, 1);
    expect;
    expect(pb).toStrictEqual(state.books);
  });

  test("should work for optional objects", () => {
    let prevState = state;
    expect(prevState.config.obj1).toBeUndefined();
    state = reducer(prevState, { group: "Sample", name: "modifyConfigObj1" });
    expect(state.config.obj1).toBeUndefined();
    prevState = state;
    state = reducer(prevState, {
      group: "Sample",
      name: "setConfigObj1",
      payload: { one: 5 }
    });
    expect(prevState.config.obj1).toBeUndefined();
    expect(state.config.obj1).toEqual({ one: 5 });
    prevState = state;
    state = reducer(prevState, { group: "Sample", name: "modifyConfigObj1" });
    expect(state.config.obj1?.one).toBe(6);
  });

  test("should work for optional array argument access ", () => {
    let prevState = state;
    expect(prevState.config.obj2).toBeUndefined();
    state = reducer(prevState, {
      group: "Sample",
      name: "setConfigObj2a",
      payload: ""
    });
    expect(state.config.obj2).toBeUndefined();
    prevState = state;
    const o = { two: 3 };
    state = reducer(state, {
      group: "Sample",
      name: "setConfigObj2",
      payload: o
    });
    expect(state.config.obj2).toStrictEqual(o);
    prevState = state;
    state = reducer(prevState, {
      group: "Sample",
      name: "setConfigObj2a",
      payload: ""
    });
    expect(state.config.obj2?.obj2a).toBeUndefined();
    prevState = state;
    const o1: Sample["config"]["obj2"] = { two: 5, obj2a: [{ name: "" }] };
    state = reducer(prevState, {
      group: "Sample",
      name: "setConfigObj2",
      payload: o1
    });
    expect(state.config.obj2).toStrictEqual(o1);
    prevState = state;
    state = reducer(prevState, {
      group: "Sample",
      name: "setConfigObj2a",
      payload: ""
    });
    expect(state.config.obj2!.obj2a![0].obj2ao).toBeUndefined();
    prevState = state;
    const o2: Sample["config"]["obj2"] = {
      two: 5,
      obj2a: [{ name: "", obj2ao: { value: "hello1" } }]
    };
    state = reducer(prevState, {
      group: "Sample",
      name: "setConfigObj2",
      payload: o2
    });
    expect(state.config.obj2).toStrictEqual(o2);
    prevState = state;
    const h = "hello2";
    state = reducer(prevState, {
      group: "Sample",
      name: "setConfigObj2a",
      payload: h
    });
    expect(state.config.obj2?.obj2a![0].obj2ao?.value).toStrictEqual(h);
  });
});
