


export class ViewUtils {

    static htmlEscapes: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#x27;',
        '`': '&#x60;'
    }

    static escapeHtmlChar = (chr: string) => {
        return ViewUtils.htmlEscapes[chr]
    }

    static reUnescapedHtml = /[&<>"'`]/g;

    static reHasUnescapedHtml = new RegExp(ViewUtils.reUnescapedHtml.source);

    static on(target: any, type: any, callback: any, useCapture?: any) {
        target.addEventListener(type, callback, !!useCapture);
    }

    static escape(str: string) {
        return (str && ViewUtils.reHasUnescapedHtml.test(str))
            ? str.replace(ViewUtils.reUnescapedHtml, ViewUtils.escapeHtmlChar)
            : str;
    }

    static delegate(target: any, selector: any, type: any, handler: any) {
        function dispatchEvent(event: any) {
            var targetElement = event.target;
            var potentialElements = document.querySelectorAll(selector);
            var hasMatch = Array.prototype.indexOf.call(potentialElements, targetElement) >= 0;

            if (hasMatch) {
                handler.call(targetElement, event);
            }
        }

        // https://developer.mozilla.org/en-US/docs/Web/Events/blur
        var useCapture = type === 'blur' || type === 'focus';

        this.on(target, type, dispatchEvent, useCapture);
    }

    static parent(element: any, tagName: string) {
        if (!element.parentNode) {
            return;
        }
        if ((element.parentNode as any).tagName.toLowerCase() === tagName.toLowerCase()) {
            return element.parentNode
        }
        this.parent(element.parentNode, tagName)
    }
}