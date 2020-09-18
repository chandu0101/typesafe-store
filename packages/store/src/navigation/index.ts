import { ReducerGroup } from "../reducer";

type NavigationState = { location: Location };

export type Location = {
  path: string;
  params?: Record<string, string | number>;
  queryParams?: Record<string, string | number>;
  state?: any;
};

export interface Navigation {
  listen(listener: (loc: Location) => void): () => void;
  replace(loc: Location): void;
  push(loc: Location): void;
  goBack(): void;
  goTo(i: string | number): void;
}

export const NAVIGATION_REDUCER_GROUP_NAME = "TypeSafeStoreNavigation";

export type NavigationAction = {
  name: "setLocation";
  group: typeof NAVIGATION_REDUCER_GROUP_NAME;
  payload: Location;
};

export const NavigationReducerGroup: ReducerGroup<
  NavigationState,
  NavigationAction,
  typeof NAVIGATION_REDUCER_GROUP_NAME,
  undefined
> = {
  r: (state: NavigationState, action: NavigationAction) => {
    const t = action.name;
    switch (t) {
      case "setLocation": {
        const location = state.location;
        return { ...state, location };
      }
    }
  },
  g: NAVIGATION_REDUCER_GROUP_NAME,
  m: { a: {} },
  ds: {} as any,
};
