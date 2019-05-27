function createStylesDiff(node: HTMLElement, styles: Styles) {
    const domStylesNames = [...node.style];
    const domStyle = node.style;
    const diff: Styles = {};
    for (const styleName in styles) {
        const pos = domStylesNames.indexOf(styleName);
        if (pos === -1) {
            diff[styleName] = styles[styleName];
        } else {
            domStylesNames[pos] = undefined!;
            if (String(styles[styleName]) !== domStyle[styleName as never]) {
                diff[styleName] = styles[styleName];
            }
        }
    }
    for (const domStyleName of domStylesNames) {
        if (domStyleName !== undefined) {
            diff[domStyleName] = '';
        }
    }
    return diff;
}

function createAttrsDiff(node: HTMLElement, attrs: Attrs, tagName: string) {
    const domAttrs = [...node.attributes].map(attr => attr.nodeName);
    const diff: Attrs = {};
    for (const attrName in attrs) {
        const attrValue = attrs[attrName];
        const pos = domAttrs.indexOf(attrName);
        if (pos > -1) {
            domAttrs[pos] = undefined!;
            if (attrName === 'style') {
                const styleDiff = createStylesDiff(node, attrValue as Styles);
                diff[attrName] = styleDiff;
            } else if (
                attrName === 'value' &&
                (tagName === 'select' || tagName === 'textarea') &&
                String(attrValue) === (node as HTMLSelectElement).value
            ) {
            } else {
                if (node.getAttribute(attrName) !== String(attrValue)) {
                    diff[attrName] = attrValue;
                }
            }
        } else {
            diff[attrName] = attrValue;
        }
    }
    for (const attr of domAttrs) {
        if (attr === undefined) {
            diff[attr] = null;
        }
    }
    return diff;
}

function eventCallback(event: Event) {
    const {data, eventProps, domProps = []} = (event.target as NodeWithCallbackData).__callbackData;
    const eventData = extractProps(event, eventProps);
    const domExtractedProps = domProps.map(props => extractProps(getNode(props.id), props.props));
    const message = {
        event: eventData,
        domProps: domExtractedProps,
        data: data,
    };
}

function extractProps(from: unknown, shape: unknown): unknown {
    type Hash = {[key: string]: unknown};
    if (shape === undefined) return;
    if (Array.isArray(shape)) {
        if (Array.isArray(from)) {
            return from.map(val => extractProps(val, shape[0]));
        } else {
            return [];
        }
    } else if (Array.isArray(from)) {
        return;
    }
    if (typeof shape === 'object' && shape !== null && from !== null && typeof from === 'object') {
        const res = {} as Hash;
        for (const key in shape) {
            if (key === '__args') continue;
            const subShape = (shape as Hash)[key] as {__args?: unknown[]};
            let subFrom = (from as Hash)[key];
            const args = subShape.__args;
            if (args !== undefined && typeof subFrom === 'function') {
                subFrom = (from as {[name: string]: (...args: unknown[]) => unknown})[key](...args);
            }
            res[key] = extractProps(subShape, subFrom);
        }
        return res;
    }
    return from;
}

function attrIsEvent(attr: string) {
    return attr.length > 2 && attr[0] === 'o' && attr[1] === 'n';
}

type EventCallback = {eventProps: object; domProps?: {props: object; id: ID}[]; data: object};
type NodeWithCallbackData = HTMLElement & {__callbackData: EventCallback};
function setAttrs(node: HTMLElement, attrs: Attrs, tagName: string) {
    for (const attr in attrs) {
        const value = attrs[attr];
        if (value === null || value === false) {
            if (attrIsEvent(attr)) {
                node.removeEventListener(attr.substr(2), eventCallback);
            } else if (attr === 'xlinkHref') {
                node.removeAttributeNS(xlinkNS, 'xlink:href');
            } else {
                node.removeAttribute(attr);
            }
        } else if (attr === 'style') {
            setStyles(node, value as Styles);
        } else if (attr === 'xlinkHref') {
            node.setAttributeNS(xlinkNS, 'xlink:href', value as string);
        } else if (attrIsEvent(attr)) {
            (node as NodeWithCallbackData).__callbackData = value as EventCallback;
            node.addEventListener(attr.substr(2), eventCallback, {passive: true});
        } else {
            if (attr === 'value') {
                if (tagName === 'select' || tagName === 'textarea') {
                    (node as HTMLInputElement).value = value as string;
                    continue;
                }
            }
            node.setAttribute(attr, value === true ? '' : (value as string));
        }
    }
}

function setStyles(node: HTMLElement, styles: Styles) {
    const domStyle = node.style;
    for (const styleName in styles) {
        const value = styles[styleName];
        if (value === '') {
            domStyle[styleName as never] = '';
        }
    }
    for (const styleName in styles) {
        const value = styles[styleName];
        if (value !== '') {
            domStyle[styleName as never] = value;
        }
    }
}
