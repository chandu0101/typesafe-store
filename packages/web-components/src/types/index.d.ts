declare global {
    interface HTMLElement {
        connectedCallback(): void;
        context: Record<string, any>
        updateProvidedContext(key: string, value: any): void
        connectedCallback(): void
    }
}

export default global;