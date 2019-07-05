"use strict";
function sendCommands(commands) {
    self.postMessage(commands);
}
function transformCallbackBackend(callback) {
    const callbackWithCommand = callback;
    if (callbackWithCommand.extractArgs === undefined) {
        callbackWithCommand.extractArgs = [];
    }
    if (callbackWithCommand.command !== undefined) {
        const command = callbackWithCommand.command;
        if (command.extractArgs === callbackWithCommand.extractArgs) {
            return callbackWithCommand.command;
        }
    }
    const id = String(GLOBAL_RPC_CALLBACK_ID_COUNTER++);
    const command = {
        type: '__fn__',
        id,
        extractArgs: callbackWithCommand.extractArgs,
        returnValue: undefined,
    };
    callbackWithCommand.command = command;
    GLOBAL_RPC_CALLBACK_MAP.set(id, callbackWithCommand);
    return command;
}
function setDataToCallback(callback, extractArgs) {
    const callbackWithCommand = callback;
    if (callbackWithCommand.extractArgs === undefined) {
        callbackWithCommand.extractArgs = extractArgs;
    }
    else {
        immutableDeepMerge(callbackWithCommand.extractArgs, extractArgs);
    }
    return callback;
}
function disposeCallback(callback) {
    const callbackWithCommand = callback;
    const command = callbackWithCommand.command;
    GLOBAL_RPC_CALLBACK_MAP.delete(command.id);
    callbackWithCommand.command = undefined;
}
function transformCallbackOnce(callback) {
    const command = transformCallbackBackend((...args) => {
        GLOBAL_RPC_CALLBACK_MAP.delete(command.id);
        return callback(...args);
    });
    return command;
}
// function createPromise<T>(extractArgs: object[], returnValue?: unknown) {
//     return new Promise<T>((resolve, reject) => {
//         transformCallbackOnce(resolve as () => void, reject, extractArgs, returnValue);
//     });
// }
self.addEventListener('message', msg => {
    const data = msg.data;
    if (Array.isArray(data)) {
        for (const item of data) {
            if (isObj(item) && item.type === '__res__') {
                const callbackObj = GLOBAL_RPC_CALLBACK_MAP.get(item.id);
                if (callbackObj === undefined)
                    throw new Error('Callback is not registered');
                callbackObj(...item.data);
            }
        }
    }
});
if (!isObj(self.window)) {
    self.window = {
        location: {
            reload() {
                sendCommands([
                    {
                        group: 'RPC',
                        action: 'call',
                        obj: ClientWindow,
                        path: ['location', 'reload'],
                        args: [],
                        callback: transformCallbackBackend(() => { }),
                    },
                ]);
            },
        },
    };
}
if (!isObj(self.document)) {
    self.document = {
        createElement(tagName) {
            return { tagName };
        },
        querySelectorAll(query) {
            if (query === 'link[rel="stylesheet"]') {
                sendCommands([
                    {
                        group: 'style',
                        action: 'updateAll',
                    },
                ]);
            }
            return [];
        },
        getElementsByTagName(query) {
            if (query === 'head') {
                return [
                    {
                        appendChild(node) {
                            if (node.tagName === 'script') {
                                if (node.src.match(/Client/i)) {
                                    sendCommands([
                                        {
                                            group: 'script',
                                            action: 'load',
                                            url: node.src,
                                            onLoad: transformCallbackOnce(node.onload),
                                            onError: transformCallbackOnce(node.onerror),
                                        },
                                    ]);
                                }
                                else {
                                    try {
                                        setTimeout(() => {
                                            importScripts(node.src);
                                            node.onload();
                                        });
                                    }
                                    catch (e) {
                                        node.onerror();
                                    }
                                }
                            }
                            else if (node.tagName === 'link') {
                                sendCommands([
                                    {
                                        group: 'style',
                                        action: 'load',
                                        url: node.href,
                                        onLoad: transformCallbackOnce(node.onload),
                                        onError: transformCallbackOnce(node.onerror),
                                    },
                                ]);
                            }
                        },
                    },
                ];
            }
            return [];
        },
    };
}
const GLOBAL_ROOTS = new Map();
let GLOBAL_CLIENT_NODE_ID_COUNTER = 0;
let GLOBAL_VNODE_ID_COUNTER = 0;
let GLOBAL_COMMAND_LIST = [];
let GLOBAL_CURRENT_COMPONENT;
const GLOBAL_HOOKS = {
    beforeComponent(node) { },
    afterComponent(node) { },
    unmountComponent(node) { },
    restartComponent(node) { },
    cancelComponent(node) { },
};
let GLOBAL_UPDATE_CANCELLED = false;
let GLOBAL_MOUNTING = false;
let GLOBAL_NOW = Date.now();
let GLOBAL_TRX_ID = 1;
let GLOBAL_TASKS = [];
const ClientWindow = {};
const GLOBAL_SCHEDULE = [];
const GLOBAL_CLIENT_SCRIPTS_MAP = new Map();
let GLOBAL_RPC_CALLBACK_ID_COUNTER = 0;
const GLOBAL_RPC_CALLBACK_MAP = new Map();
const GLOBAL_DEV_GC_VNODES = process.env.NODE_ENV === 'development' ? new WeakSet() : undefined;
self.GCVNodes = GLOBAL_DEV_GC_VNODES;
const kindParent = { type: 'kind' };
const componentKind = { kind: 'component', parent: kindParent };
const domKind = { kind: 'dom', parent: kindParent };
const textKind = { kind: 'text', parent: kindParent };
const arrayKind = { kind: 'array', parent: kindParent };
const portalKind = { kind: 'portal', parent: kindParent };
const CancellationToken = { cancellationToken: true };
function createVTextNode(text) {
    return {
        _id: GLOBAL_VNODE_ID_COUNTER++,
        status: 'created',
        children: text,
        key: undefined,
        kind: textKind,
        props: undefined,
        type: undefined,
        instance: genNodeId(),
        parentComponent: undefined,
    };
}
// foo.bar
function createDomVNode(type, attrs, key, children) {
    return {
        _id: GLOBAL_VNODE_ID_COUNTER++,
        status: 'created',
        children: children,
        key: key,
        kind: domKind,
        props: attrs,
        type: type,
        instance: genNodeId(),
        parentComponent: undefined,
    };
}
function createComponentVNode(type, props, key) {
    const componentId = GLOBAL_CLIENT_NODE_ID_COUNTER++;
    const node = {
        _id: GLOBAL_VNODE_ID_COUNTER++,
        status: 'created',
        children: undefined,
        key: key,
        kind: componentKind,
        props,
        type,
        instance: {
            parentDom: undefined,
            trxId: -1,
            componentId,
            errored: false,
            node: undefined,
            state: undefined,
        },
        parentComponent: undefined,
    };
    node.instance.node = node;
    return node;
}
function createVArrayNode(arr) {
    return {
        _id: GLOBAL_VNODE_ID_COUNTER++,
        status: 'created',
        kind: arrayKind,
        children: arr,
        key: undefined,
        props: undefined,
        type: undefined,
        instance: GLOBAL_CLIENT_NODE_ID_COUNTER++,
        parentComponent: undefined,
    };
}
function createVPortalNode(type, children) {
    return {
        _id: GLOBAL_VNODE_ID_COUNTER++,
        status: 'created',
        kind: portalKind,
        children: children,
        key: undefined,
        props: undefined,
        type: undefined,
        instance: type,
        parentComponent: undefined,
    };
}
function norm(value) {
    if (value === null || value === undefined) {
        return createVTextNode('');
    }
    if (Array.isArray(value)) {
        if (value.length === 0)
            return createVTextNode('');
        return createVArrayNode(value);
    }
    if (isVNode(value)) {
        if (value.status === 'cancelled' || value.status === 'obsolete' || value.status === 'removed') {
            return cloneVNode(value, undefined, true);
        }
        return value;
    }
    if (isObj(value)) {
        console.warn('objects are not allowed as children', value);
    }
    if (typeof value === 'string' || typeof value === 'number') {
        return createVTextNode(String(value));
    }
    return createVTextNode('');
}
function isVNode(value) {
    return isObj(value) && isObj(value.kind) && value.kind.parent === kindParent;
}
function cloneVNode(n, newProps = n.props, deep) {
    const node = n;
    if (node.kind === componentKind) {
        return createComponentVNode(node.type, newProps, node.key);
    }
    if (node.kind === domKind) {
        const children = deep
            ? node.children.map(node => cloneVNode(norm(node), undefined, true))
            : node.children;
        return createDomVNode(node.type, newProps, node.key, children);
    }
    if (node.kind === arrayKind) {
        const children = deep
            ? node.children.map(node => cloneVNode(norm(node), undefined, true))
            : node.children;
        return createVArrayNode(children);
    }
    if (node.kind === portalKind) {
        return createVPortalNode(node.instance, deep ? cloneVNode(norm(node.children), undefined, true) : node.children);
    }
    if (node.kind === textKind) {
        return createVTextNode(node.children);
    }
    return node;
}
function ensureVDomNode(node) {
    if (!isVNode(node) || node.kind !== domKind)
        throw new Error('Children must be a tag element');
    return node;
}
function getPersistId(node) {
    if (typeof node === 'string')
        return node;
    if (node.kind === componentKind) {
        return node.instance.componentId;
    }
    if (node.kind === portalKind) {
        return node.instance;
    }
    if (node.kind === arrayKind) {
        return node.instance;
    }
    return node.instance;
}
function mountVNode(parentNode, node, parentId, beforeId) {
    if (node.status === 'active') {
        node = cloneVNode(node, undefined, false);
    }
    // assert(!maybeCancelled.includes(node));
    GLOBAL_TASKS.push({ kind: 'created', node: node });
    node.parentComponent = parentNode;
    if (node.kind === componentKind) {
        node = mountComponent(node, parentId, beforeId);
    }
    else if (node.kind === domKind) {
        node = mountVDom(node, parentId, beforeId);
    }
    else if (node.kind === textKind) {
        addCommand(node, {
            action: 'create',
            group: 'text',
            rootId: findRootId(node),
            parentId,
            beforeId,
            id: node.instance,
            text: node.children,
        });
    }
    else if (node.kind === arrayKind) {
        for (let i = 0; i < node.children.length; i++) {
            mountChild(node, i, parentId, beforeId);
        }
    }
    else if (node.kind === portalKind) {
        node.children = mountVNode(node, norm(node.children), node.instance, null);
    }
    else {
        throw node;
    }
    node.status = 'active';
    return node;
}
function mountComponent(node, parentId, beforeId) {
    node.instance.parentDom = parentId;
    const newChildren = runComponent(node);
    node.children = mountVNode(node, newChildren, parentId, beforeId);
    return node;
}
function mountVDom(node, parentId, beforeId) {
    const props = node.props;
    addCommand(node, {
        action: 'create',
        group: 'tag',
        parentId,
        beforeId,
        rootId: findRootId(node),
        id: node.instance,
        attrs: transformAttrCallbacks(node.props),
        tag: node.type,
    });
    for (let i = 0; i < node.children.length; i++) {
        mountChild(node, i, node.instance, null);
    }
    if (node.type === 'select') {
        updateSelectValue(node);
    }
    if (props.withCommand !== undefined) {
        addCommand(node, {
            action: 'create',
            group: 'custom',
            parentId: node.instance,
            data: props.withCommand.data,
            name: props.withCommand.name,
        });
    }
    return node;
}
function mountChild(node, i, parentId, beforeId) {
    node.children[i] = mountVNode(node, norm(node.children[i]), parentId, beforeId);
}
function replaceVNode(parentNode, node, oldNode, parentId) {
    const beforeId = findChildVDom(oldNode).instance;
    removeVNode(oldNode, true);
    const newNode = mountVNode(parentNode, node, parentId, beforeId);
    return newNode;
}
function updateVNode(parentNode, node, oldNode, parentId) {
    if (oldNode === node && getPersistId(oldNode.parentComponent) === getPersistId(parentNode)) {
        GLOBAL_TASKS.push({ kind: 'parent', node: oldNode, newParent: parentNode });
        return oldNode;
    }
    if (node.status === 'active') {
        node = cloneVNode(node, undefined, false);
    }
    node.parentComponent = parentNode;
    if (node.kind !== oldNode.kind) {
        return replaceVNode(parentNode, node, oldNode, parentId);
    }
    if (node.kind === componentKind) {
        return updateComponent(node, oldNode, parentId);
    }
    if (node.kind === domKind) {
        return updateDom(node, oldNode, parentId);
    }
    if (node.kind === textKind) {
        return updateText(node, oldNode);
    }
    if (node.kind === arrayKind) {
        return updateArray(node, oldNode, parentId);
    }
    if (node.kind === portalKind) {
        return updatePortal(node, oldNode);
    }
    throw node;
}
function afterUpdate(node) {
    node.status = 'active';
    return node;
}
function beforeUpdate(node, oldNode) {
    // assert(!maybeObsolete.includes(oldNode));
    // assert(!maybeCancelled.includes(node));
    GLOBAL_TASKS.push({ kind: 'obsolete', node: oldNode });
    GLOBAL_TASKS.push({ kind: 'created', node });
}
function updateComponent(node, oldNode, parentId) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node.parentComponent, node, oldNode, parentId);
    }
    beforeUpdate(node, oldNode);
    node.instance = oldNode.instance;
    node.instance.parentDom = parentId;
    const newChildren = shouldComponentUpdate(node.props, oldNode.props) ? runComponent(node) : oldNode.children;
    node.children = updateVNode(node, newChildren, oldNode.children, parentId);
    GLOBAL_TASKS.push({ kind: 'updateComponent', node: node });
    return afterUpdate(node);
}
function shouldComponentUpdate(newProps, oldProps) {
    const oldPropKeys = Object.keys(oldProps);
    for (const key in newProps) {
        const pos = oldPropKeys.indexOf(key);
        if (pos === -1)
            return true;
        oldPropKeys[pos] = undefined;
        if (newProps[key] !== oldProps[key])
            return true;
    }
    for (const key of oldPropKeys) {
        if (key !== undefined)
            return true;
    }
    return false;
}
function updateDom(node, oldNode, parentId) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node.parentComponent, node, oldNode, parentId);
    }
    beforeUpdate(node, oldNode);
    node.instance = oldNode.instance;
    const props = node.props;
    const len = Math.min(node.children.length, oldNode.children.length);
    const diffAttrs = updateAttrs(node.props, oldNode.props);
    if (diffAttrs !== undefined) {
        addCommand(node, {
            action: 'update',
            group: 'tag',
            tag: node.type,
            id: node.instance,
            attrs: diffAttrs,
        });
    }
    for (let i = 0; i < len; i++) {
        const oldChild = oldNode.children[i];
        updateChild(node, i, oldChild, parentId);
    }
    for (let i = len; i < node.children.length; i++) {
        mountChild(node, i, node.instance, null);
    }
    for (let i = len; i < oldNode.children.length; i++) {
        const oldChild = oldNode.children[i];
        removeVNode(oldChild, true);
    }
    if (diffAttrs !== undefined && node.type === 'select') {
        updateSelectValue(node);
    }
    if (props.withCommand !== undefined) {
        addCommand(node, {
            action: 'update',
            group: 'custom',
            parentId: node.instance,
            data: props.withCommand.data,
            name: props.withCommand.name,
        });
    }
    return afterUpdate(node);
}
function updateText(node, oldNode) {
    node.instance = oldNode.instance;
    beforeUpdate(node, oldNode);
    if (node.children !== oldNode.children) {
        addCommand(node, { action: 'update', group: 'text', id: node.instance, text: node.children });
    }
    return afterUpdate(node);
}
function updatePortal(node, oldNode) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node.parentComponent, node, oldNode, node.instance);
    }
    beforeUpdate(node, oldNode);
    node.children = updateVNode(node, norm(node.children), oldNode.children, node.instance);
    return afterUpdate(node);
}
function updateChild(node, i, oldChild, parentId) {
    node.children[i] = updateVNode(node, norm(node.children[i]), oldChild, parentId);
}
function runComponent(node) {
    GLOBAL_CURRENT_COMPONENT = node.instance;
    node.instance.trxId = GLOBAL_TRX_ID;
    let newChildren;
    try {
        const prevErrored = node.instance.errored;
        node.instance.errored = false;
        GLOBAL_HOOKS.beforeComponent(node);
        newChildren = norm(node.type(node.props));
        GLOBAL_HOOKS.afterComponent(node);
        if (prevErrored) {
            processBoundarySubcomponentErrorGone(node);
        }
    }
    catch (err) {
        GLOBAL_HOOKS.afterComponent(node);
        newChildren = norm(undefined);
        node.instance.errored = true;
        if (err === CancellationToken) {
            cancelUpdating();
        }
        else {
            processBoundarySubcomponentError(node, err);
        }
    }
    finally {
        GLOBAL_CURRENT_COMPONENT = undefined;
    }
    return newChildren;
}
function getParents(node) {
    let n = node.parentComponent;
    const parents = [];
    while (typeof n !== 'string') {
        parents.push(n);
        n = n.parentComponent;
    }
    return parents;
}
function restartComponent(instance) {
    const node = instance.node;
    if (instance.trxId === GLOBAL_TRX_ID ||
        node.status === 'removed' ||
        node.status === 'obsolete' ||
        node.status === 'cancelled') {
        return false;
    }
    const newChildren = runComponent(node);
    const newChild = updateVNode(node, newChildren, node.children, instance.parentDom);
    GLOBAL_TASKS.push({ kind: 'restart', node, newChild });
    GLOBAL_TASKS.push({ kind: 'updateComponent', node });
    return true;
}
function setPromiseToParentSuspense(component, suspenseInstance, timeout, promise) {
    const suspense = suspenseInstance.state;
    if (suspense.components.size === 0) {
        suspense.timeoutAt = GLOBAL_NOW + timeout;
    }
    suspense.version++;
    suspense.components.set(component, promise);
    const version = suspense.version;
    resolveSuspensePromises(suspense).then(() => {
        restartSuspense(suspenseInstance, version);
    });
    if (suspense.timeoutAt > GLOBAL_NOW) {
        const parentSuspense = getParents(suspenseInstance.node).find(parent => parent.type === Suspense);
        const sleepPromise = sleep(suspense.timeoutAt - GLOBAL_NOW + 1);
        if (parentSuspense === undefined) {
            sleepPromise.then(() => {
                if (suspense.version === version && suspense.components.size > 0) {
                    transactionStart();
                    restartComponent(suspenseInstance);
                    commitUpdating();
                }
            });
            cancelUpdating();
        }
        else {
            throw Promise.race([Promise.all([...suspense.components.values()]), sleepPromise]);
        }
    }
}
function restartSuspense(instance, version) {
    const state = instance.state;
    if (state.components.size === 0 || version !== state.version)
        return;
    transactionStart();
    let lastVersion = state.version;
    // const components = [...state.components];
    for (const [component] of state.components) {
        if (component.node.type === Suspense && component.state.components.size === 0) {
            continue;
        }
        restartComponent(component);
    }
    commitUpdating();
    if (state.version === lastVersion) {
        state.components.clear();
        transactionStart();
        restartComponent(instance);
        commitUpdating();
        // console.log('restartSuspense done');
    }
}
function resolveSuspensePromises(state) {
    const promises = [...state.components.values()];
    const lastVersion = state.version;
    return Promise.all(promises).then(() => {
        if (state.version !== lastVersion) {
            return resolveSuspensePromises(state);
        }
    });
}
function findRootId(node) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        n = n.parentComponent;
    }
    return n;
}
function processBoundarySubcomponentRemoved(node) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === Boundary && n.status !== 'removed' && n) {
            try {
                if (typeof n.props.onSubcomponentRemoved === 'function' && n.props.onSubcomponentRemoved(node)) {
                    break;
                }
            }
            catch (err) {
                console.error(err);
            }
        }
        n = n.parentComponent;
    }
}
function processBoundarySubcomponentErrorGone(node) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === Boundary && n) {
            try {
                if (typeof n.props.onSubcomponentErrorGone === 'function' && n.props.onSubcomponentErrorGone(node)) {
                    break;
                }
            }
            catch (err) {
                console.error(err);
            }
        }
        n = n.parentComponent;
    }
}
function processBoundarySubcomponentError(node, err) {
    let foundHandler = false;
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === Boundary && n) {
            try {
                if (n.props.onCatch(err, node)) {
                    foundHandler = true;
                    break;
                }
            }
            catch (err2) {
                err = err2;
            }
        }
        n = n.parentComponent;
    }
    if (!foundHandler) {
        console.error(err);
        scheduleUpdate(() => unmount(findRootId(node)));
    }
}
function lazy(cmp) {
    let component;
    let error;
    let promise;
    return function Lazy(props) {
        if (promise === undefined) {
            promise = cmp().then(m => (component = m.default), e => (error = e));
        }
        if (error !== undefined)
            throw error;
        if (component === undefined)
            throw promise;
        return createElement(component, props);
    };
}
function client(cmp) {
    return function ClientComponent(props) {
        const url = loadClientScript(cmp);
        const onResolve = transformCallbackOnce(() => { });
        const onError = transformCallbackOnce(() => { });
        return createElement('div', {
            withCommand: {
                data: {
                    url,
                    props,
                    onResolve,
                    onError,
                },
                name: 'clientComponent',
            },
        });
    };
}
function IntersectionObserverContainer({ children, rootMargin, threshold, }) {
    const child = ensureVDomNode(children);
    const withCommand = {
        name: 'IntersectionObserverContainer',
        data: { rootMargin, threshold },
    };
    return cloneVNode(child, { ...child.props, withCommand }, false);
}
function IntersectionObserverElement({ children, onVisible, onVisibleParams, onInvisible, }) {
    const child = ensureVDomNode(children);
    const withCommand = {
        name: 'IntersectionObserverElement',
        data: {
            onVisible: transformCallbackBackend(setDataToCallback(onVisible, [onVisibleParams === undefined ? {} : onVisibleParams])),
            onInvisible: onInvisible === undefined ? undefined : transformCallbackBackend(onInvisible),
        },
    };
    return cloneVNode(child, { ...child.props, withCommand }, false);
}
function Suspense(props) {
    const instance = getCurrentComponent();
    if (instance.state === undefined) {
        instance.state = {
            version: 0,
            timeoutAt: 0.0,
            components: new Map(),
        };
    }
    const state = instance.state;
    const showFallback = state.components.size > 0 && state.timeoutAt <= GLOBAL_NOW;
    const fallback = showFallback ? props.fallback : null;
    const vDomChild = ensureVDomNode(props.children);
    const children = cloneVNode(vDomChild, { ...vDomChild.props, hidden: state.components.size > 0 }, false);
    return createElement(Boundary, {
        onCatch: (err, node) => {
            if (err instanceof Promise) {
                scheduleUpdate(() => restartComponent(instance));
                setPromiseToParentSuspense(node.instance, instance, props.timeout, err);
                return true;
            }
            return false;
        },
        children: [fallback, children],
    });
}
function ErrorBoundary(props) {
    const instance = getCurrentComponent();
    if (instance.state === undefined) {
        instance.state = {
            fallbackRendered: false,
            errors: [],
        };
    }
    const state = instance.state;
    const children = state.errors.length > 0 ? props.fallback(state.errors[0]) : props.children;
    if (state.errors.length > 0) {
        state.fallbackRendered = true;
    }
    return createElement(Boundary, {
        onCatch: (err, node) => {
            if (err instanceof Error) {
                if (state.fallbackRendered) {
                    throw err;
                }
                if (state.errors.length === 0) {
                    state.errors.push(err);
                    new Promise(() => node.type(node.props)).catch(() => { });
                    scheduleUpdate(() => restartComponent(instance));
                }
                return true;
            }
            return false;
        },
        children,
    });
}
function Fragment(props) {
    return props.children;
}
function Portal(props) {
    return createVPortalNode(props.container, norm(props.children));
}
function Boundary(props) {
    return props.children;
}
function loadClientScript(src) {
    const res = GLOBAL_CLIENT_SCRIPTS_MAP.get(src);
    if (res instanceof Promise)
        throw res;
    if (res instanceof Error)
        throw res;
    if (res !== undefined)
        return res;
    if (typeof src === 'string') {
        let resolve;
        const promise = new Promise(res => (resolve = res));
        const load = () => {
            GLOBAL_CLIENT_SCRIPTS_MAP.set(src, 'loaded');
            resolve();
        };
        sendCommands([
            {
                group: 'script',
                action: 'load',
                url: src,
                onLoad: transformCallbackOnce(load),
                onError: transformCallbackOnce(load),
            },
        ]);
        throw promise;
    }
    throw src().catch(err => {
        const m = err.message.match(/^Cannot find module '(.*?)'$/);
        if (m !== null) {
            GLOBAL_CLIENT_SCRIPTS_MAP.set(src, m[1]);
        }
        else {
            throw err;
        }
    });
}
function createContext(defaultValue) {
    function ContextProvider(props) {
        return props.children;
    }
    return {
        Provider: ContextProvider,
        Consumer: function ContextConsumer(props) {
            let n = getCurrentComponent().node.parentComponent;
            while (typeof n !== 'string') {
                if (n.type === ContextProvider) {
                    const value = n.props.value;
                    return props.children(value);
                }
                n = n.parentComponent;
            }
            return props.children(defaultValue);
        },
    };
}
function updateArray(node, oldNode, parentId) {
    beforeUpdate(node, oldNode);
    node.instance = oldNode.instance;
    const newList = node.children;
    const oldList = oldNode.children;
    const skipHead = updateHead(node, oldNode, parentId);
    const skipTail = updateTail(node, oldNode, skipHead, parentId);
    const newEnd = newList.length - skipTail;
    const oldEnd = oldList.length - skipTail;
    const newDiff = newEnd - skipHead;
    const oldDiff = oldEnd - skipHead;
    if (newDiff > 0 || oldDiff > 0) {
        const map = {};
        const oldUsed = Array(oldList.length);
        if (newDiff > 0 && oldDiff > 0) {
            for (let i = skipHead; i < oldEnd; i++) {
                const oldChild = oldList[i];
                map[oldChild.key] = i;
            }
        }
        let beforeVNode = newEnd < node.children.length ? node.children[newEnd] : undefined;
        for (let i = newEnd - 1; i >= skipHead; i--) {
            const child = norm(node.children[i]);
            const oldChildIdx = map[child.key];
            const beforeId = beforeVNode === undefined ? null : findChildVDom(beforeVNode).instance;
            if (oldChildIdx !== undefined && oldUsed[oldChildIdx] === undefined) {
                oldUsed[oldChildIdx] = true;
                const oldChild = oldList[oldChildIdx];
                beforeVNode = updateVNode(node, child, oldChild, parentId);
                moveChild(beforeVNode, beforeId);
            }
            else {
                beforeVNode = mountVNode(node, child, parentId, beforeId);
            }
            node.children[i] = beforeVNode;
        }
        for (let i = skipHead; i < oldEnd; i++) {
            if (oldUsed[i] === undefined) {
                const oldChild = oldList[i];
                removeVNode(oldChild, true);
            }
        }
    }
    return afterUpdate(node);
}
function updateHead(node, oldNode, parentId) {
    const max = node.children.length < oldNode.children.length ? node.children.length : oldNode.children.length;
    let start = 0;
    while (start < max) {
        const child = norm(node.children[start]);
        const oldChild = oldNode.children[start];
        if (child.key !== oldChild.key)
            break;
        updateChild(node, start, oldChild, parentId);
        start++;
    }
    return start;
}
function updateTail(node, oldNode, skipHead, parentId) {
    let newEnd = node.children.length;
    let oldEnd = oldNode.children.length;
    while (newEnd > skipHead && oldEnd > skipHead) {
        const newI = newEnd - 1;
        const oldI = oldEnd - 1;
        const child = norm(node.children[newI]);
        const oldChild = oldNode.children[oldI];
        if (child.key !== oldChild.key)
            break;
        updateChild(node, newI, oldChild, parentId);
        newEnd--;
        oldEnd--;
    }
    return node.children.length - newEnd;
}
function moveChild(node, beforeId) {
    if (node.kind === domKind) {
        addCommand(node, { action: 'move', group: 'tag', tag: node.type, id: node.instance, beforeId });
        return node.instance;
    }
    if (node.kind === textKind) {
        addCommand(node, { action: 'move', group: 'text', id: node.instance, beforeId });
        return node.instance;
    }
    if (node.kind === componentKind) {
        return moveChild(node.children, beforeId);
    }
    if (node.kind === arrayKind) {
        for (let i = node.children.length - 1; i >= 0; i--) {
            beforeId = moveChild(node.children[i], beforeId);
        }
        return beforeId;
    }
    if (node.kind === portalKind) {
        return void 0;
    }
    return node;
}
function removeVNode(node, realRemove) {
    GLOBAL_TASKS.push({ kind: 'removed', node });
    if (node.kind === componentKind) {
        removeVNode(node.children, realRemove);
    }
    else if (node.kind === domKind) {
        const props = node.props;
        if (props.withCommand !== undefined) {
            addCommand(node, {
                action: 'remove',
                group: 'custom',
                parentId: node.instance,
                data: props.withCommand.data,
                name: props.withCommand.name,
            });
        }
        removeChildren(node, false);
        if (realRemove) {
            addCommand(node, { action: 'remove', group: 'tag', tag: node.type, id: node.instance });
        }
    }
    else if (node.kind === textKind) {
        if (realRemove) {
            addCommand(node, { action: 'remove', group: 'text', id: node.instance });
        }
    }
    else if (node.kind === arrayKind) {
        removeChildren(node, realRemove);
    }
    else if (node.kind === portalKind) {
        removeVNode(node.children, true);
    }
}
function removeChildren(node, realRemove) {
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        removeVNode(child, realRemove);
    }
}
function assert(val) {
    if (typeof val !== 'boolean')
        throw new Error('Not Boolean');
    if (!val) {
        debugger;
        throw new Error('Assert!');
    }
}
function nonNull(val) {
    return val;
}
function never(val) {
    throw new Error('Never possible: ' + val);
}
function visitEachNode(node, cb) {
    if (node.kind === componentKind) {
        return node.children;
    }
    if (node.kind === domKind) {
        for (const child of node.children) {
        }
        return;
    }
    if (node.kind === arrayKind) {
        for (const child of node.children) {
        }
        return;
    }
    if (node.kind === portalKind) {
        return;
    }
    if (node.kind === textKind) {
        return;
    }
    return node;
}
function is(val) {
    return true;
}
function genNodeId() {
    return GLOBAL_CLIENT_NODE_ID_COUNTER++;
}
function findChildVDom(node) {
    if (node.kind === domKind || node.kind === textKind)
        return node;
    if (node.kind === componentKind)
        return findChildVDom(node.children);
    if (node.kind === arrayKind)
        return findChildVDom(node.children[0]);
    if (node.kind === portalKind)
        return findChildVDom(node.children);
    return node;
}
function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}
function noop() { }
function addCommand(node, command) {
    const comandWithVNode = command;
    comandWithVNode.vNode = node;
    GLOBAL_COMMAND_LIST.push(command);
}
// function toJSON(node: VNode): unknown {
//     const {key, suspense, errorBoundary, state, kind, type, props, id, ...other} = node as any;
//     other.kind = kind.constructor.name;
//     if (type) {
//         other.type = typeof type === 'string' ? type : type.name;
//     }
//     if (Array.isArray(node.children)) {
//         other.children = node.children.map(val => toJSON(val as VNode));
//     } else if (typeof node.children !== 'string') {
//         other.children = toJSON(node.children as any);
//     }
//     return other;
// }
function ensureObject(value) {
    if (isObj(value))
        return value;
    return {};
}
// function getClientScriptUrl(src: string | (() => Promise<unknown>)) {
//     isCustomUrlCall = true;
//     try {
//         return Promise.resolve(typeof src === 'string' ? src : ((src() as unknown) as string));
//     } finally {
//         isCustomUrlCall = false;
//     }
// }
function isObj(obj) {
    return typeof obj === 'object' && obj !== null;
}
function isObjectSame(obj1, obj2) {
    if (isObj(obj1) && isObj(obj2) && obj1.constructor === obj2.constructor) {
        if (Array.isArray(obj2)) {
            if (obj1.length !== obj2.length)
                return false;
            if (!obj2.every((obj2Item, i) => isObjectSame(obj1[i], obj2Item)))
                return false;
        }
        else {
            let len = 0;
            for (const key in obj1) {
                len++;
                if (!isObjectSame(obj1[key], obj2[key]))
                    return false;
            }
            for (const key in obj2)
                len--;
            if (len !== 0)
                return false;
        }
        return true;
    }
    return obj1 === obj2;
}
function immutableDeepMerge(obj1, obj2) {
    if (isObjectSame(obj1, obj2))
        return obj1;
    if (isObj(obj1) && isObj(obj2)) {
        const newObj = (Array.isArray(obj1) ? [] : {});
        for (const key in obj2) {
            newObj[key] = immutableDeepMerge(obj1[key], obj2[key]);
        }
        return newObj;
    }
    return obj2;
}
function scheduleUpdate(cb) {
    GLOBAL_SCHEDULE.push(cb);
}
function updateAttrs(attrs, oldAttrs) {
    const diff = {};
    let hasChanges = false;
    const oldAttrArr = Object.keys(oldAttrs);
    for (const attr in attrs) {
        const value = attrs[attr];
        const oldPos = oldAttrArr.indexOf(attr);
        if (oldPos === -1) {
            diff[attr] = value;
            hasChanges = true;
        }
        else {
            oldAttrArr[oldPos] = undefined;
            const oldValue = oldAttrs[attr];
            if (oldValue !== value) {
                if (attr === 'style') {
                    const diffStyle = diffStyles(value, oldValue);
                    if (diffStyle !== undefined) {
                        diff[attr] = diffStyle;
                        hasChanges = true;
                    }
                }
                else if (typeof value === 'function' || typeof oldValue === 'function') {
                    const newRPCCallback = typeof value === 'function' ? transformCallbackBackend(value) : undefined;
                    const oldRPCCallback = typeof oldValue === 'function' ? transformCallbackBackend(oldValue) : undefined;
                    const listener = {
                        newListener: newRPCCallback && newRPCCallback,
                        oldListener: oldRPCCallback && oldRPCCallback,
                    };
                    diff[attr] = listener;
                    hasChanges = true;
                }
                else {
                    diff[attr] = value;
                    hasChanges = true;
                }
            }
        }
    }
    for (const oldAttr of oldAttrArr) {
        if (oldAttr !== undefined) {
            diff[oldAttr] = null;
            hasChanges = true;
        }
    }
    return hasChanges ? diff : undefined;
}
function diffStyles(styles, oldStyles) {
    let hasChanges = false;
    const diff = {};
    styles = ensureObject(styles);
    oldStyles = ensureObject(oldStyles);
    const oldKeys = Object.keys(oldStyles);
    for (const key in styles) {
        const value = styles[key];
        const oldPos = oldKeys.indexOf(key);
        if (oldPos === -1) {
            diff[key] = value;
            hasChanges = true;
        }
        else {
            oldKeys[oldPos] = undefined;
            if (oldStyles[key] !== styles[key]) {
                diff[key] = value;
                hasChanges = true;
            }
        }
    }
    for (const oldKey of oldKeys) {
        if (oldKey !== undefined) {
            diff[oldKey] = '';
            hasChanges = true;
        }
    }
    return hasChanges ? diff : undefined;
}
function updateSelectValue(node) {
    addCommand(node, {
        action: 'update',
        group: 'tag',
        id: node.instance,
        attrs: { value: node.props.value },
        tag: node.type,
    });
}
function transformAttrCallbacks(attrs) {
    let newAttrs;
    for (const attr in attrs) {
        const value = attrs[attr];
        if (typeof value === 'function') {
            const command = transformCallbackBackend(value);
            const listener = { newListener: command };
            if (newAttrs === undefined)
                newAttrs = { ...attrs };
            newAttrs[attr] = listener;
        }
    }
    return newAttrs === undefined ? attrs : newAttrs;
}
function withPreventDefault(cb) {
    return setDataToCallback(cb, [{ preventDefault: { __args: [] } }]);
}
function withStopProgation(cb) {
    return setDataToCallback(cb, [{ stopPropagation: { __args: [] } }]);
}
function withTargetValue(cb) {
    const newCb = (event) => cb(event.target.value);
    return setDataToCallback(newCb, [{ target: { value: '' } }]);
}
function withTargetChecked(cb) {
    const newCb = (event) => cb(event.target.checked);
    return setDataToCallback(newCb, [{ target: { checked: true } }]);
}
function withEventData(cb, shape) {
    return setDataToCallback(cb, [shape]);
}
function createElement(type, p, ...children) {
    let props = ensureObject(p);
    const key = props.key;
    if (typeof type === 'string') {
        return createDomVNode(type, props, key, children);
    }
    else if (typeof type === 'function') {
        if (children.length > 0) {
            props.children = children.length === 1 ? children[0] : children;
        }
        return createComponentVNode(type, props, key);
    }
    else {
        throw new Error('Component type is empty: ' + type);
    }
}
function setParentComponents(node, parentComponent) {
    node.parentComponent = parentComponent;
}
function render(node, htmlId) {
    transactionStart();
    const rootId = htmlId;
    const id = htmlId;
    const rootNode = node;
    const oldNode = GLOBAL_ROOTS.get(rootId);
    if (oldNode === undefined) {
        GLOBAL_MOUNTING = true;
        addCommand(rootNode, { action: 'start', group: 'mount', rootId: rootId });
    }
    const newNode = oldNode === undefined ? mountVNode(rootId, rootNode, id, null) : updateVNode(rootId, rootNode, oldNode, id);
    if (oldNode === undefined) {
        addCommand(newNode, { action: 'end', group: 'mount', rootId: rootId });
    }
    if (process.env.NODE_ENV === 'development') {
        const devToolsCommand = {
            action: 'update',
            group: 'devtools',
            isRoot: true,
            unmounted: [],
            node: convertVNodeToDevToolsJSON(newNode),
        };
        GLOBAL_COMMAND_LIST.push(devToolsCommand);
    }
    if (oldNode === undefined || !GLOBAL_UPDATE_CANCELLED) {
        GLOBAL_ROOTS.set(rootId, newNode);
    }
    commitUpdating();
    return newNode.status === 'removed' ? undefined : newNode;
}
function unmountComponentAtNode(htmlId) {
    transactionStart();
    unmount(htmlId);
    commitUpdating();
}
function unmount(htmlId) {
    const node = GLOBAL_ROOTS.get(htmlId);
    if (node !== undefined) {
        removeVNode(node, true);
        if (process.env.NODE_ENV === 'development') {
            const devToolsCommand = {
                action: 'update',
                group: 'devtools',
                isRoot: true,
                unmounted: [getPersistId(node)],
                node: undefined,
            };
            GLOBAL_COMMAND_LIST.push(devToolsCommand);
        }
        GLOBAL_ROOTS.delete(htmlId);
    }
}
function transactionStart() {
    GLOBAL_UPDATE_CANCELLED = false;
    GLOBAL_NOW = Date.now();
    GLOBAL_TRX_ID++;
    for (const [, root] of GLOBAL_ROOTS) {
    }
}
function commitUpdating() {
    const shouldCancel = !GLOBAL_MOUNTING && GLOBAL_UPDATE_CANCELLED;
    for (const up of GLOBAL_TASKS) {
        const { node } = up;
        if (node.status === 'obsolete' && up.kind === 'updateComponent') {
            continue;
        }
        if (shouldCancel) {
            if (up.kind === 'created') {
                const { node } = up;
                if (node.kind === componentKind) {
                    GLOBAL_HOOKS.cancelComponent(node);
                }
                node.status = 'cancelled';
                destroyVNode(node);
            }
            continue;
        }
        if (up.kind !== 'restart') {
        }
        if (up.kind === 'obsolete') {
            node.status = 'obsolete';
            destroyVNode(node);
        }
        else if (up.kind === 'removed') {
            if (node.kind === componentKind) {
                processBoundarySubcomponentRemoved(node);
            }
            node.status = 'removed';
            destroyVNode(node);
        }
        else if (up.kind === 'restart') {
            const { newChild } = up;
            const node = up.node.instance.node;
            node.children = newChild;
            GLOBAL_HOOKS.restartComponent(node);
            if (process.env.NODE_ENV === 'development') {
                const unmounted = [];
                for (const up2 of GLOBAL_TASKS) {
                    if (up2.kind === 'removed') {
                        unmounted.push(getPersistId(node));
                    }
                }
                const devToolsCommand = {
                    action: 'update',
                    group: 'devtools',
                    isRoot: false,
                    unmounted: unmounted,
                    node: convertVNodeToDevToolsJSON(node),
                };
                GLOBAL_COMMAND_LIST.push(devToolsCommand);
            }
        }
        else if (up.kind === 'updateComponent') {
            const { node } = up;
            node.instance.node = node;
        }
        else if (up.kind === 'parent') {
            const { newParent } = up;
            node.parentComponent = newParent;
        }
        else if (up.kind === 'created') {
        }
        else {
        }
    }
    const prevUpdatings = GLOBAL_TASKS;
    GLOBAL_TASKS = [];
    GLOBAL_UPDATE_CANCELLED = false;
    GLOBAL_MOUNTING = false;
    if (GLOBAL_SCHEDULE.length > 0) {
        const cb = GLOBAL_SCHEDULE.shift();
        transactionStart();
        cb();
        commitUpdating();
        return;
    }
    for (const [, root] of GLOBAL_ROOTS) {
        if (root.status === 'removed') {
        }
        else {
        }
    }
    const filteredCommands = filterObsoleteCommands(GLOBAL_COMMAND_LIST);
    if (filteredCommands.length > 0) {
        sendCommands(filteredCommands);
    }
    GLOBAL_COMMAND_LIST = [];
}
function filterObsoleteCommands(commandList) {
    return commandList.filter(command => {
        const vNode = command.vNode;
        if (vNode === undefined)
            return true;
        let skip = vNode.status === 'cancelled';
        if (command.action === 'remove' && vNode.status !== 'removed') {
            skip = true;
        }
        command.vNode = undefined;
        return !skip;
    });
}
function destroyVNode(node) {
    if (node.kind === domKind) {
        disposeVDomNodeCallbacks(node);
    }
    if (node.kind === componentKind) {
        GLOBAL_HOOKS.unmountComponent(node);
    }
    if (GLOBAL_DEV_GC_VNODES !== undefined) {
        GLOBAL_DEV_GC_VNODES.add(node);
    }
}
function disposeVDomNodeCallbacks(node) {
    const attrs = node.props;
    for (const attr in attrs) {
        const value = attrs[attr];
        if (typeof value === 'function') {
            disposeCallback(value);
        }
    }
}
function getCurrentComponent() {
    if (GLOBAL_CURRENT_COMPONENT === undefined)
        throw new Error('No current component');
    return GLOBAL_CURRENT_COMPONENT;
}
function cancelUpdating() {
    GLOBAL_UPDATE_CANCELLED = true;
}
exports.Suspense = Suspense;
exports.Portal = Portal;
exports.ErrorBoundary = ErrorBoundary;
exports.Fragment = Fragment;
exports.lazy = lazy;
exports.client = client;
exports.render = render;
exports.createElement = createElement;
exports.createContext = createContext;
exports.restartComponent = restartComponent;
exports.getCurrentComponent = getCurrentComponent;
exports.unmountComponentAtNode = unmountComponentAtNode;
exports.withPreventDefault = withPreventDefault;
exports.withStopProgation = withStopProgation;
exports.withTargetValue = withTargetValue;
exports.withTargetChecked = withTargetChecked;
exports.withEventData = withEventData;
exports.IntersectionObserverContainer = IntersectionObserverContainer;
exports.IntersectionObserverElement = IntersectionObserverElement;
exports.setHook = function setHook(type, value) {
    GLOBAL_HOOKS[type] = value;
};
exports.IntersectionObserverElement = IntersectionObserverElement;
exports.loadClientScript = loadClientScript;
exports.getNodeRootId = findRootId;
exports.scheduleUpdate = scheduleUpdate;
exports.CancellationToken = CancellationToken;
exports.cancelUpdating = cancelUpdating;
// const devToolsNodes = new Map<number, DevToolsNode>();
// let devToolsId = 0;
let convertVNodeToDevToolsJSON = (node) => undefined;
if (process.env.NODE_ENV === 'development') {
    function convertProps(props) {
        if (isVNode(props))
            return 'VNode';
        if (isObj(props)) {
            const newObj = {};
            if (Array.isArray(props))
                return props.map(convertProps);
            for (const prop in props) {
                const value = props[prop];
                try {
                    // could be maximum callstack
                    newObj[prop] = convertProps(value);
                }
                catch (err) {
                    console.warn(err);
                }
            }
            return newObj;
        }
        if (typeof props === 'function')
            return { __fn: `${props.name}` };
        return props;
    }
    convertVNodeToDevToolsJSON = function convertVNodeToDevToolsJSON(node) {
        let stringText;
        let children = [];
        let currentElement;
        let renderedComponent;
        let instance = {};
        const props = convertProps(node.props);
        if (node.kind === componentKind) {
            children = [];
            if (node.type === Fragment) {
                currentElement = { type: '#fragment', props };
                if (node.children.kind === arrayKind) {
                    children = node.children.children.map(convertVNodeToDevToolsJSON);
                }
            }
            else if (node.type === Portal && node.children.kind === portalKind) {
                currentElement = { type: '#portal', props };
                if (node.children.children.kind === arrayKind) {
                    children = node.children.children.children.map(convertVNodeToDevToolsJSON);
                }
            }
            else {
                currentElement = { type: node.type.name, props };
                renderedComponent = convertVNodeToDevToolsJSON(node.children);
            }
        }
        else if (node.kind === domKind) {
            currentElement = { type: node.type, props };
            children = node.children.map(convertVNodeToDevToolsJSON);
        }
        else if (node.kind === arrayKind) {
            currentElement = { type: '#array', props: {} };
            children = node.children.map(convertVNodeToDevToolsJSON);
        }
        else if (node.kind === portalKind) {
            currentElement = { type: '#portal', props: {} };
        }
        else if (node.kind === textKind) {
            currentElement = String(node.children);
            stringText = String(node.children);
        }
        else {
            return node;
        }
        const id = getPersistId(node);
        return {
            _id: id,
            _rootNodeID: findRootId(node),
            _nodeId: findChildVDom(node).instance,
            _stringText: stringText,
            _instance: instance,
            _currentElement: currentElement,
            _renderedChildren: children,
            _renderedComponent: renderedComponent,
        };
    };
}
