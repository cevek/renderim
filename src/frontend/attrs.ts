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

function attrIsEvent(attr: string) {
    return attr.length > 2 && attr[0] === 'o' && attr[1] === 'n';
}

let mountNodes: {id: ID; node: Node; command: RPCCallback}[] = [];

type EventCallbackCommand = {eventProps: object; domProps?: {props: object; id: ID}[]; data: object};
type NodeWithDisposers = HTMLElement & {__eventDisposers: {name: string; dispose: () => void}[]};
function setAttrs(node: HTMLElement, id: ID, attrs: Attrs, tagName: string) {
    for (const attr in attrs) {
        const value = attrs[attr];
        if (value === null || value === false) {
            if (attrIsEvent(attr)) {
                const nodeWithDisposers = node as NodeWithDisposers;
                const callbackDispose = nodeWithDisposers.__eventDisposers.find(ev => ev.name === attr);
                if (callbackDispose !== undefined) {
                    callbackDispose.dispose();
                } else {
                    throw new Error('EventData is not found');
                }
            } else if (attr === 'xlinkHref') {
                node.removeAttributeNS(xlinkNS, 'xlink:href');
            } else {
                node.removeAttribute(attr);
            }
        } else if (attr === 'ref') {
            mountNodes.push({id, node, command: value as RPCCallback});
        } else if (attr === 'style') {
            setStyles(node, value as Styles);
        } else if (attr === 'xlinkHref') {
            node.setAttributeNS(xlinkNS, 'xlink:href', value as string);
        } else if (attrIsEvent(attr)) {
            setCallback(node, id, attr, value as RPCCallback);
        } else if (attr === 'value' && (tagName === 'select' || tagName === 'textarea')) {
            (node as HTMLInputElement).value = value as string;
        } else {
            node.setAttribute(attr, value === true ? '' : (value as string));
        }
    }
}

function setCallback(node: Node, id: ID, callbackName: string, command: RPCCallback) {
    const nodeWithDisposers = node as NodeWithDisposers;
    if (nodeWithDisposers.__eventDisposers === undefined) nodeWithDisposers.__eventDisposers = [];
    const callback = (event: Event) =>
        sendToBackend([createResult(command.id, [extractProps(event, command.extractArgs[0])])]);
    const eventName = callbackName.substr(2);
    node.addEventListener(eventName, callback, {passive: true});
    const disposer = {
        name: callbackName,
        dispose: () => {
            const pos = nodeWithDisposers.__eventDisposers.indexOf(disposer);
            nodeWithDisposers.__eventDisposers.splice(pos, 1);
            node.removeEventListener(eventName, callback);
        },
    };
    nodeWithDisposers.__eventDisposers.push(disposer);
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
