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

function createAttrsDiff(node: HTMLElement, attrs: Attrs, tagName: string): Attrs {
    const domAttrs = [...node.attributes].map(attr => attr.nodeName);
    const diff: {[key: string]: unknown} = {};
    for (const attrName in attrs) {
        const attrValue = attrs[attrName];
        const pos = domAttrs.indexOf(attrName);
        if (pos > -1) {
            domAttrs[pos] = undefined!;
            if (attrName === 'style') {
                const styleDiff = createStylesDiff(node, attrValue as Styles);
                diff[attrName] = styleDiff;
            } else if (
                (attrName === 'value' || attrName === 'defaultValue') &&
                (tagName === 'select' || tagName === 'textarea' || tagName === 'input')
            ) {
                const value = (node as HTMLInputElement).value;
                if (String(attrValue) !== value) {
                    diff[attrName] = attrValue;
                }
            } else if ((attrName === 'checked' || attrName === 'defaultChecked') && tagName === 'input') {
                const checked = (node as HTMLInputElement).checked;
                if (Boolean(attrValue) !== checked) {
                    diff[attrName] = attrValue;
                }
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

function attrIsEvent(attr: string) {
    return attr.length > 2 && attr[0] === 'o' && attr[1] === 'n';
}

let mountNodes: {id: ID; node: Node; command: RPCCallback}[] = [];

type ElementWithListeners = HTMLElement & {__listeners?: {[event: string]: ((event: Event) => void) | undefined}};
function setAttrs(node: HTMLElement, id: ID, attrs: Attrs, tagName: string, isUpdate: boolean) {
    for (const attr in attrs) {
        const value = attrs[attr];
        if (attrIsEvent(attr)) {
            const eventName = attr.substr(2).toLowerCase();
            const {oldListener, newListener} = value as DomListener;
            const nodeWithListeners = node as ElementWithListeners;
            if (newListener !== undefined) {
                if (nodeWithListeners.__listeners === undefined) {
                    nodeWithListeners.__listeners = {};
                    const listeners = nodeWithListeners.__listeners;
                    node.addEventListener(eventName, event => {
                        const listener = listeners[attr];
                        if (listener !== undefined) {
                            return listener(event);
                        }
                    });
                }
                nodeWithListeners.__listeners[attr] = transformCallback(newListener);
            } else if (oldListener !== undefined) {
                nodeWithListeners.__listeners![attr] = undefined;
            }
        } else if (value === null || value === false) {
            if (attr === 'xlinkHref') {
                node.removeAttributeNS(xlinkNS, 'xlink:href');
            } else {
                node.removeAttribute(attr);
            }
        } else if (attr === 'ref') {
            mountNodes.push({id, node, command: value as RPCCallback});
        } else if (attr === 'defaultValue') {
            if (!isUpdate) {
                if (tagName === 'select' || tagName === 'textarea') {
                    (node as HTMLInputElement).value = value as string;
                } else {
                    node.setAttribute('value', value === true ? '' : (value as string));
                }
            }
        } else if (attr === 'defaultChecked') {
            if (!isUpdate && value) {
                node.setAttribute('checked', '');
            }
        } else if (attr === 'style') {
            setStyles(node, value as Styles);
        } else if (attr === 'xlinkHref') {
            node.setAttributeNS(xlinkNS, 'xlink:href', value as string);
        } else if (attr === 'value' && (tagName === 'input' || tagName === 'select' || tagName === 'textarea')) {
            (node as HTMLInputElement).value = value as string;
        } else if (attr === 'checked' && tagName === 'input') {
            (node as HTMLInputElement).checked = value as boolean;
        } else if (attr === 'withCommand') {
        } else if (isObject(value)) {
            console.warn(`Tag attribute value <${tagName} ${attr}> is object`, value);
        } else {
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
