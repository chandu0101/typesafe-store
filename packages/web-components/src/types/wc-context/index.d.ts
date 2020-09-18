

declare module "wc-context/core" {

    export function registerProvidedContext(el: any, name: any, providedContexts: any): void

    export function notifyContextChange(el: any, name: any, value: any): void
}

declare module "wc-context" {


    type Constructor<T> = new (...args: any[]) => T;

    /**
      By using this `CustomElement` interface instead of `HTMLElement`, we avoid
      having the generated typings include most DOM API already provided by
      TypeScript. This is particularly useful since different versions of
      TypeScript may have different DOM API typings (e.g. TS 3.0.3 and TS 3.1.1).
      The required `isConnected` property is included to avoid the following
      TypeScript error:
          Type 'HTMLElement' has no properties in common with type 'CustomElement'.
    */
    interface CustomElement {
        connectedCallback?(): void;
        disconnectedCallback?(): void;
        readonly isConnected: boolean;
        // context: Record<string, any>
        // updateProvidedContext(key: string, value: any): void
    }
    export function withContext<T extends Constructor<CustomElement>>(base: T): T & { context: any }
}