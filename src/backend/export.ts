function createElement(
    type: string | ComponentFun,
    props: {[key: string]: unknown} | null,
    ...children: VInput[]
): VNodeCreated {
    props = ensureObject(props);
    const key = props.key as string | undefined;
    if (typeof type === 'string') {
        return createDomVNode(type, props, key, children);
    } else if (typeof type === 'function') {
        if (children.length > 0) {
            const propsChildren = children.length === 1 ? children[0] : children;
            if (props === null) props = {children: propsChildren};
            else props.children = propsChildren;
        } else if (props === null) props = {};
        return createComponentVNode(type, props, key);
    } else {
        throw new AssertError('Component type is empty: ' + type);
    }
}

function render(node: VInput, htmlId: string) {
    const rootId = htmlId as RootId;
    const id = (htmlId as unknown) as ID;

    currentComponent = createComponentVNode(Suspense, {
        fallback: '',
        timeout: 0,
        children: undefined!,
    });
    currentComponent.parentComponent = rootId;
    Object.freeze(currentComponent);

    const rootNode = createComponentVNode(ErrorBoundary, {
        children: createComponentVNode(Suspense, {
            fallback: 'Root Loading...',
            timeout: 0,
            children: node,
        }),
        fallback: (props: {errors: Error[]}) => {
            console.error(props.errors);
            return 'Something went wrong';
        },
    });

    const oldNode = roots.get(rootId);
    assert(commandList.length === 0);
    if (oldNode === undefined) {
        addCommand(rootNode, {action: 'start', group: 'mount', rootId: rootId});
    }
    const newNode = oldNode === undefined ? mountVNode(rootNode, id, null) : updateVNode(rootNode, oldNode, id);
    roots.set(rootId, newNode);
    if (oldNode === undefined) {
        addCommand(newNode, {action: 'end', group: 'mount', rootId: rootId});
        if (process.env.NODE_ENV === 'development') {
            const devToolsCommand: UpdateDevtools = {
                action: 'update',
                group: 'devtools',
                isRoot: true,
                unmounted: [],
                node: convertVNodeToDevToolsJSON(newNode),
            };
            commandList.push(devToolsCommand);
        }
    }
    commitUpdating();
    // console.log('after render state', toJSON(newNode));
    // console.log(JSON.stringify(toJSON(newNode), null, 2));
    visitEachNode(newNode, n => assert(n.status === 'active'));
}

function unmountComponentAtNode(htmlId: string) {
    const node = roots.get(htmlId as RootId);
    if (node !== undefined) {
        removeVNode(node, true);
        if (process.env.NODE_ENV === 'development') {
            const devToolsCommand: UpdateDevtools = {
                action: 'update',
                group: 'devtools',
                isRoot: true,
                unmounted: [getPersistId(node)],
                node: undefined,
            };
            commandList.push(devToolsCommand);
        }
    }
    commitUpdating();
}

function shouldCancel(node: VNode | VNodeCreated) {
    return findSuspense(node).state.promises.length > 0; // || node.errorBoundary.state.errors.length > 0;
}
function commitUpdating() {
    for (const {oldNode, newNode} of maybeRestarted) {
        assert(oldNode.status === 'active');
        assert(newNode.status === 'active');
        if (!shouldCancel(oldNode)) {
            (oldNode as NoReadonly<VComponentNode>).children = newNode.children;
            const unmounted = [];
            for (const node of maybeRemoved) {
                unmounted.push(getPersistId(node));
            }
            if (process.env.NODE_ENV === 'development') {
                const devToolsCommand: UpdateDevtools = {
                    action: 'update',
                    group: 'devtools',
                    isRoot: false,
                    unmounted: unmounted,
                    node: convertVNodeToDevToolsJSON(oldNode),
                };
                commandList.push(devToolsCommand);
            }
        }
    }
    // console.log({maybeRemoved, maybeObsolete, maybeCancelled});
    for (const node of maybeRemoved) {
        assert(node.status === 'active');
        if (!shouldCancel(node)) {
            (node as NoReadonly<VNode>).status = 'removed';
            destroyVNode(node);
        }
    }
    for (const node of maybeObsolete) {
        assert(node.status === 'active' || node.status === 'removed');
        if (!shouldCancel(node)) {
            (node as NoReadonly<VNode>).status = 'obsolete';
            destroyVNode(node);
        }
    }
    for (const node of maybeCancelled) {
        assert(node.status === 'active');
        if (shouldCancel(node)) {
            node.status = 'cancelled';
            destroyVNode(node);
        }
    }
    for (const {newParent, node} of maybeUpdatedParent) {
        assert(node.status === 'active');
        if (!shouldCancel(node)) {
            (node as NoReadonly<VNode>).parentComponent = newParent;
        }
    }
    const filteredCommands = (commandList as CommandWithParentVNode[]).filter(command => {
        const vNode = command.vNode;
        if (vNode === undefined) return true;
        let skip = vNode.status === 'cancelled';
        if (command.action === 'remove' && vNode.status !== 'removed') {
            skip = true;
        }
        command.vNode = undefined!;
        return !skip;
    });
    sendCommands(filteredCommands);

    commandList = [];
    maybeRestarted = [];
    maybeObsolete = [];
    maybeRemoved = [];
    maybeCancelled = [];
    maybeUpdatedParent = [];
}

function destroyVNode(node: VNodeCreated | VNode) {
    if (node.kind === domKind) {
        disposeVDomNodeCallbacks(node);
    }
    if (node.kind === componentKind) {
        hooks.unmountComponent(node);
    }
    if (GCVNodes !== undefined) {
        GCVNodes.add(node);
    }
}

function disposeVDomNodeCallbacks(node: VDomNodeCreated | VDomNode) {
    assert(node.status === 'removed' || node.status === 'cancelled' || node.status === 'obsolete');
    const attrs = node.props;
    for (const attr in attrs) {
        const value = attrs[attr];
        if (typeof value === 'function') {
            disposeCallback(value);
        }
    }
}

function getCurrentComponentNode() {
    if (currentComponent === undefined) throw new Error('No current component');
    return currentComponent;
}

exports.Suspense = Suspense;
exports.Portal = Portal;
exports.ErrorBoundary = ErrorBoundary;
exports.Fragment = Fragment;
exports.lazy = lazy;
exports.render = render;
exports.createElement = createElement;
exports.createContext = createContext;
exports.restartComponent = restartComponent;
exports.unmountComponentAtNode = unmountComponentAtNode;

exports.withPreventDefault = withPreventDefault;
exports.withStopProgation = withStopProgation;
exports.withTargetValue = withTargetValue;
exports.withTargetChecked = withTargetChecked;
exports.withEventData = withEventData;

exports.IntersectionObserverContainer = IntersectionObserverContainer;
exports.IntersectionObserverElement = IntersectionObserverElement;

exports.setHook = function setHook<K extends keyof typeof hooks>(type: K, value: typeof hooks[K]) {
    hooks[type] = value;
};
exports.IntersectionObserverElement = IntersectionObserverElement;
