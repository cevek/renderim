"use strict";
function isObject(obj) {
    return typeof obj === 'object' && obj !== null;
}
function initDevTools() {
    if (process.env.NODE_ENV === 'development' && typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
        const roots = {};
        const devToolsNodes = new Map();
        const bridge = {
            ComponentTree: {
                getNodeFromInstance(instance) {
                    return getNode(instance._id);
                },
                getClosestInstanceFromNode(node) {
                    node._id;
                    const devToolsNode = devToolsNodes.get(node._id);
                    if (devToolsNode === undefined)
                        throw nevr();
                    return devToolsNode;
                },
            },
            Mount: {
                _instancesByReactRootID: roots,
                _renderNewRootComponent(instance) {
                    return instance;
                },
            },
            Reconciler: {
                mountComponent(instance) { },
                performUpdateIfNecessary(instance) { },
                receiveComponent(instance) { },
                unmountComponent(instance) { },
            },
        };
        __REACT_DEVTOOLS_GLOBAL_HOOK__.inject(bridge);
        function createFunctionWithName(name) {
            const obj = { [name]: function () { } };
            const fn = obj[name];
            return fn;
        }
        function update(instance) {
            if (typeof instance._currentElement !== 'string') {
                const { props } = instance._currentElement;
                for (const prop in props) {
                    const value = props[prop];
                    if (isObject(value) && typeof value.__fn === 'string') {
                        props[prop] = createFunctionWithName(value.__fn);
                    }
                }
            }
            instance._renderedChildren = instance._renderedChildren.map(update);
            if (instance._renderedComponent !== undefined) {
                instance._renderedComponent = update(instance._renderedComponent);
                if (typeof instance._currentElement !== 'string') {
                    const el = instance._currentElement;
                    el.type = createFunctionWithName(String(el.type));
                }
            }
            const exists = devToolsNodes.get(instance._id);
            if (exists !== undefined) {
                exists._stringText = instance._stringText;
                exists._currentElement = instance._currentElement;
                exists._renderedComponent = instance._renderedComponent;
                exists._renderedChildren = instance._renderedChildren;
                bridge.Reconciler.receiveComponent(exists);
                return exists;
            }
            bridge.Reconciler.mountComponent(instance);
            devToolsNodes.set(instance._id, instance);
            return instance;
        }
        return (command) => {
            if (command.action === 'update') {
                if (command.node !== undefined) {
                    update(command.node);
                    if (command.isRoot) {
                        roots[command.node._id] = command.node;
                        bridge.Mount._renderNewRootComponent(command.node);
                    }
                }
                else if (command.isRoot) {
                    delete roots[command.unmounted[0]];
                }
            }
            else {
                nevr(command.action);
            }
            for (const unmounted of command.unmounted) {
                const devToolsNode = devToolsNodes.get(unmounted);
                if (devToolsNode === undefined)
                    throw nevr();
                bridge.Reconciler.unmountComponent(devToolsNode);
            }
        };
    }
    return () => { };
}
// Object.defineProperty(window, 'parcelRequire', {value: () => {}});
const domMap = [];
const svgNS = 'http://www.w3.org/2000/svg';
const xlinkNS = 'http://www.w3.org/1999/xlink';
const domRoots = new Map();
let WORKER;
window.registerWorker = registerWorker;
function registerWorker(worker) {
    WORKER = worker;
    worker.addEventListener('message', msg => {
        renderCommands(msg.data);
    });
}
function isSvg(tag, node) {
    return (tag === 'svg' ||
        (tag !== 'div' &&
            tag !== 'span' &&
            tag !== 'td' &&
            tag !== 'tr' &&
            tag !== 'li' &&
            tag !== 'h1' &&
            tag !== 'h2' &&
            tag !== 'h3' &&
            tag !== 'i' &&
            tag !== 'u' &&
            tag !== 'b' &&
            tag !== 'strong' &&
            tag !== 'em' &&
            tag !== 'img' &&
            node.namespaceURI === svgNS));
}
function setNode(id, node, isHTML) {
    if (domMap.length <= id) {
        for (let i = domMap.length; i <= id; i++) {
            domMap.push(undefined);
        }
    }
    if (isHTML) {
        node._id = id;
    }
    domMap[id] = node;
}
function renderCommands(commands) {
    for (let i = 0; i < commands.length; i++) {
        renderCommand(commands[i]);
    }
    mountNodes.map(({ node, command }) => transformCallback(command)(node));
    mountNodes = [];
}
function startHydrate(id) {
    domRoots.set(id, new Map());
}
function endHydrate(id) {
    const map = domRoots.get(id);
    for (const [parentNode, nextNode] of map) {
        let n = nextNode;
        while (n !== null) {
            parentNode.removeChild(n);
            n = n.nextSibling;
        }
    }
    domRoots.delete(id);
}
function createDom(command) {
    const parentNode = getNode(command.parentId);
    const nodeIsSVG = isSvg(command.tag, parentNode);
    let node;
    let beforeNode = getBeforeNode(command.beforeId);
    const hydratingMap = domRoots.get(command.rootId);
    if (hydratingMap !== undefined) {
        let nextNode = hydratingMap.get(parentNode);
        if (nextNode === undefined) {
            nextNode = parentNode.firstChild;
            hydratingMap.set(parentNode, nextNode);
        }
        if (nextNode !== null) {
            if (isComment(nextNode) && nextNode.nodeValue === 'n') {
                hydratingMap.set(parentNode, nextNode.nextSibling);
            }
            else if (isHTMLElement(nextNode) && nextNode.localName === command.tag) {
                node = nextNode;
                hydratingMap.set(parentNode, nextNode.nextSibling);
                const diff = createAttrsDiff(node, command.attrs, command.tag);
                setAttrs(node, command.id, diff, command.tag, false);
            }
        }
        if (node === undefined) {
            beforeNode = nextNode;
        }
    }
    if (node === undefined) {
        node = nodeIsSVG
            ? document.createElementNS(svgNS, command.tag)
            : document.createElement(command.tag);
        parentNode.insertBefore(node, beforeNode);
        if (hydratingMap !== undefined) {
            hydratingMap.set(node, null);
        }
        setAttrs(node, command.id, command.attrs, command.tag, false);
    }
    setNode(command.id, node, true);
    node._command = command;
    const { withCommand } = command.attrs;
    if (withCommand !== undefined) {
        handleWithCommand(node, withCommand);
    }
}
// const clientScriptsMap = new Map<
//     string,
//     {default: (dom: HTMLElement, props: unknown) => {update(props: unknown): void; destroy?(): void}}
// >();
function handleWithCommand(node, withCommand) {
    if (withCommand.name === 'IntersectionObserverContainer') {
        node._observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                const command = entry.target._command;
                const elementProps = command.attrs.withCommand.data;
                if (entry.isIntersecting) {
                    // const data: IntersectionObserverElementCallbackParams = {
                    //     boundingClientRect: getRectJSON(entry.boundingClientRect as DOMRect),
                    //     intersectionRect: getRectJSON(entry.intersectionRect as DOMRect),
                    //     rootBounds: getRectJSON(entry.rootBounds as DOMRect),
                    //     intersectionRatio: entry.intersectionRatio,
                    // };
                    transformCallback(elementProps.onVisible)(entry);
                }
                else if (elementProps.onInvisible !== undefined) {
                    transformCallback(elementProps.onInvisible)();
                }
            }
        }, withCommand.data);
    }
    else if (withCommand.name === 'IntersectionObserverElement') {
        findRootObserver(node).observe(node);
    }
    else if (withCommand.name === 'clientComponent') {
        const data = withCommand.data;
        const component = require(data.url);
        if (component === undefined)
            throw nevr(data.url);
        new Promise(() => {
            node.__clientComponent = component.default(node, data.props);
            transformCallback(data.onResolve)();
        }).catch(err => {
            if (err instanceof Promise) {
                const resolve = transformCallback(data.onResolve);
                err.then(resolve, resolve);
            }
            else {
                transformCallback(data.onError)({ message: err.message, stack: err.stack });
            }
        });
    }
}
function findRootObserver(node) {
    let n = node.parentNode;
    while (n !== null) {
        const observer = n._observer;
        if (observer !== undefined) {
            return observer;
        }
        n = n.parentNode;
    }
    throw new Error('Observer container is not found');
}
// function getRectJSON(rect: DOMRectReadOnly): BoundingClientRect {
//     const {x, y, width, height} = rect;
//     return {x, y, width, height};
// }
function createText(command) {
    let node;
    let beforeNode = getBeforeNode(command.beforeId);
    const parentNode = getNode(command.parentId);
    const hydratingMap = domRoots.get(command.rootId);
    if (hydratingMap !== undefined) {
        let nextNode = hydratingMap.get(parentNode);
        if (nextNode === undefined) {
            nextNode = parentNode.firstChild;
            hydratingMap.set(parentNode, nextNode);
        }
        if (nextNode !== null) {
            if (isComment(nextNode) && nextNode.nodeValue === 'n') {
                hydratingMap.set(parentNode, nextNode.nextSibling);
            }
            else if (isTextNode(nextNode)) {
                if (nextNode.nodeValue !== command.text) {
                    nextNode.nodeValue = command.text;
                }
                node = nextNode;
                const nextNextNode = node.nextSibling;
                if (nextNextNode !== null && nextNextNode.nodeType === 8 && nextNextNode.nodeValue === '') {
                    hydratingMap.set(parentNode, nextNextNode.nextSibling);
                }
                else {
                    hydratingMap.set(parentNode, nextNextNode);
                }
            }
        }
        if (node === undefined) {
            beforeNode = nextNode;
        }
    }
    if (node === undefined) {
        node = document.createTextNode(command.text);
        getNode(command.parentId).insertBefore(node, beforeNode);
    }
    setNode(command.id, node, false);
}
const devTools = initDevTools();
function renderCommand(command) {
    if (command.group === 'tag') {
        if (command.action === 'create') {
            createDom(command);
        }
        else if (command.action === 'move') {
            moveNode(command.id, command.beforeId);
        }
        else if (command.action === 'update') {
            setAttrs(getNode(command.id), command.id, command.attrs, command.tag, true);
        }
        else if (command.action === 'remove') {
            removeNode(command.id);
        }
        else {
            nevr(command);
        }
    }
    else if (command.group === 'text') {
        if (command.action === 'create') {
            createText(command);
        }
        else if (command.action === 'move') {
            moveNode(command.id, command.beforeId);
        }
        else if (command.action === 'update') {
            getNode(command.id).nodeValue = command.text;
        }
        else if (command.action === 'remove') {
            removeNode(command.id);
        }
        else {
            nevr(command);
        }
    }
    else if (command.group === 'mount') {
        if (command.action === 'start') {
            startHydrate(command.rootId);
        }
        else if (command.action === 'end') {
            endHydrate(command.rootId);
        }
        else {
            nevr(command);
        }
    }
    else if (command.group === 'script') {
        if (command.action === 'load') {
            const script = document.createElement('script');
            script.src = command.url;
            script.onload = transformCallback(command.onLoad);
            script.onerror = () => transformCallback(command.onError)('Script loading error');
            document.head.appendChild(script);
        }
    }
    else if (command.group === 'style') {
        if (command.action === 'load') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = command.url;
            link.onload = transformCallback(command.onLoad);
            link.onerror = () => transformCallback(command.onError)('Link loading error');
            document.head.appendChild(link);
        }
        else if (command.action === 'updateAll') {
            const links = document.querySelectorAll('link[rel="stylesheet"]');
            for (const link of links) {
                updateLink(link);
            }
        }
    }
    else if (command.group === 'custom') {
    }
    else if (command.group === 'devtools') {
        devTools(command);
    }
    else if (command.group === 'RPC') {
        handleRPCCommand(command);
    }
    else {
        nevr(command);
    }
}
function updateLink(link) {
    const newLink = link.cloneNode();
    newLink.onload = () => link.remove();
    newLink.href = link.href.split('?')[0] + '?' + Date.now();
    link.parentNode.insertBefore(newLink, link.nextSibling);
}
function moveNode(id, beforeId) {
    const node = domMap[id];
    const beforeNode = beforeId === null ? null : domMap[beforeId];
    node.parentNode.insertBefore(node, beforeNode);
}
function removeNode(id) {
    const node = domMap[id];
    node.parentNode.removeChild(node);
    domMap[id] = undefined;
}
function getNode(id) {
    if (isObject(id))
        return window;
    return typeof id === 'string' ? document.querySelector(id) : domMap[id];
}
function getBeforeNode(id) {
    return id === null ? null : domMap[id];
}
function nevr(val) {
    throw new Error('Never possible: ' + val);
}
function isComment(node) {
    return node.nodeType === 8;
}
function isHTMLElement(node) {
    return node.nodeType === 1;
}
function isTextNode(node) {
    return node.nodeType === 3;
}
function createStylesDiff(node, styles) {
    const domStylesNames = [...node.style];
    const domStyle = node.style;
    const diff = {};
    for (const styleName in styles) {
        const pos = domStylesNames.indexOf(styleName);
        if (pos === -1) {
            diff[styleName] = styles[styleName];
        }
        else {
            domStylesNames[pos] = undefined;
            if (String(styles[styleName]) !== domStyle[styleName]) {
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
function createAttrsDiff(node, attrs, tagName) {
    const domAttrs = [...node.attributes].map(attr => attr.nodeName);
    const diff = {};
    for (const attrName in attrs) {
        const attrValue = attrs[attrName];
        const pos = domAttrs.indexOf(attrName);
        if (pos > -1) {
            domAttrs[pos] = undefined;
            if (attrName === 'style') {
                const styleDiff = createStylesDiff(node, attrValue);
                diff[attrName] = styleDiff;
            }
            else if ((attrName === 'value' || attrName === 'defaultValue') &&
                (tagName === 'select' || tagName === 'textarea' || tagName === 'input')) {
                const value = node.value;
                if (String(attrValue) !== value) {
                    diff[attrName] = attrValue;
                }
            }
            else if ((attrName === 'checked' || attrName === 'defaultChecked') && tagName === 'input') {
                const checked = node.checked;
                if (Boolean(attrValue) !== checked) {
                    diff[attrName] = attrValue;
                }
            }
            else {
                if (node.getAttribute(attrName) !== String(attrValue)) {
                    diff[attrName] = attrValue;
                }
            }
        }
        else {
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
function attrIsEvent(attr) {
    return attr.length > 2 && attr[0] === 'o' && attr[1] === 'n';
}
let mountNodes = [];
function setAttrs(node, id, attrs, tagName, isUpdate) {
    for (const attr in attrs) {
        const value = attrs[attr];
        if (attrIsEvent(attr)) {
            const eventName = attr.substr(2).toLowerCase();
            const { oldListener, newListener } = value;
            const nodeWithListeners = node;
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
            }
            else if (oldListener !== undefined) {
                nodeWithListeners.__listeners[attr] = undefined;
            }
        }
        else if (value === null || value === false) {
            if (attr === 'xlinkHref') {
                node.removeAttributeNS(xlinkNS, 'xlink:href');
            }
            else {
                node.removeAttribute(attr);
            }
        }
        else if (attr === 'ref') {
            mountNodes.push({ id, node, command: value });
        }
        else if (attr === 'defaultValue') {
            if (!isUpdate) {
                if (tagName === 'select' || tagName === 'textarea') {
                    node.value = value;
                }
                else {
                    node.setAttribute('value', value === true ? '' : value);
                }
            }
        }
        else if (attr === 'defaultChecked') {
            if (!isUpdate && value) {
                node.setAttribute('checked', '');
            }
        }
        else if (attr === 'style') {
            setStyles(node, value);
        }
        else if (attr === 'xlinkHref') {
            node.setAttributeNS(xlinkNS, 'xlink:href', value);
        }
        else if (attr === 'value' && (tagName === 'input' || tagName === 'select' || tagName === 'textarea')) {
            node.value = value;
        }
        else if (attr === 'checked' && tagName === 'input') {
            node.checked = value;
        }
        else if (attr === 'withCommand') {
        }
        else if (isObject(value)) {
            console.warn(`Tag attribute value <${tagName} ${attr}> is object`, value);
        }
        else {
            node.setAttribute(attr, value === true ? '' : value);
        }
    }
}
function setStyles(node, styles) {
    const domStyle = node.style;
    for (const styleName in styles) {
        const value = styles[styleName];
        if (value === '') {
            domStyle[styleName] = '';
        }
    }
    for (const styleName in styles) {
        const value = styles[styleName];
        if (value !== '') {
            domStyle[styleName] = value;
        }
    }
}
function transformArg(command) {
    if (isObject(command) && command.type === '__fn__') {
        return transformCallback(command);
    }
    return command;
}
function transformCallback(command) {
    const callback = (...args) => {
        sendToBackend([createResult(command.id, args.map((arg, i) => extractProps(arg, command.extractArgs[i])))]);
        return command.returnValue;
    };
    return callback;
}
function sendToBackend(data) {
    WORKER.postMessage(data);
}
function handleRPCCommand(command) {
    const { obj, path } = command;
    let o = getNode(obj);
    const lastPart = path[path.length - 1];
    for (let i = 0; i < path.length - 1; i++) {
        if (isObject(o)) {
            o = o[path[i]];
        }
        else {
            sendToBackend([createError(command.callback.id, `${o}.${path[i]} is not an object`)]);
            return;
        }
    }
    if (command.action === 'call') {
        if (typeof o[lastPart] === 'function') {
            const ret = o[lastPart](...command.args.map(transformArg));
            // console.log('RPC call', command);
            transformCallback(command.callback)(ret);
        }
        else {
            sendToBackend([createError(command.callback.id, `${o}.${lastPart} is not callable`)]);
        }
    }
    else if (command.action === 'read') {
        // console.log('RPC read', command);
        transformCallback(command.callback)(o[lastPart]);
    }
    else if (command.action === 'write') {
        // console.log('RPC write', command);
        o[lastPart] = transformArg(command.value);
    }
    else {
        nevr(command);
    }
}
function createResult(id, data) {
    return { id, isError: false, type: '__res__', data };
}
function createError(id, error) {
    return { id, isError: true, type: '__res__', data: [error] };
}
function extractProps(from, shape, root = from) {
    if (shape === undefined)
        return;
    if (Array.isArray(shape)) {
        if (Array.isArray(from)) {
            return from.map(val => extractProps(val, shape[0], root));
        }
        else {
            return [];
        }
    }
    else if (Array.isArray(from)) {
        return;
    }
    if (isObject(shape) && isObject(from)) {
        const res = {};
        for (const key in shape) {
            if (key === '__args')
                continue;
            if (key === '__conditions')
                continue;
            const subShape = shape[key];
            let subFrom = from[key];
            const args = subShape.__args;
            const conditions = subShape.__conditions;
            if (args !== undefined && typeof from[key] === 'function') {
                if (conditions === undefined || conditions.some(cond => isObjectExtends(root, cond))) {
                    subFrom = from[key](...args);
                }
            }
            res[key] = extractProps(subFrom, subShape, root);
        }
        return res;
    }
    return from;
}
function isObjectExtends(obj, base) {
    if (isObject(obj) && isObject(base) && obj.constructor === base.constructor) {
        if (Array.isArray(base)) {
            if (!base.every((subBase, i) => isObjectExtends(obj[i], subBase)))
                return false;
        }
        else {
            for (const key in base) {
                if (!isObjectExtends(obj[key], base[key]))
                    return false;
            }
        }
        return true;
    }
    return obj === base;
}
