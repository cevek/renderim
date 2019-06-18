function createElement<T extends object>(
    type: string | ((props: T) => VInput),
    p: T | null,
    ...children: VInput[]
): VNodeCreated {
    let props = ensureObject(p) as {[key: string]: unknown};
    const key = props.key as string | undefined;
    if (typeof type === 'string') {
        return createDomVNode(type, props, key, children);
    } else if (typeof type === 'function') {
        if (children.length > 0) {
            props.children = children.length === 1 ? children[0] : children;
        }
        return createComponentVNode(type as (props: object) => VInput, props, key);
    } else {
        throw new AssertError('Component type is empty: ' + type);
    }
}

function setParentComponents(node: VNodeCreated, parentComponent: ParentComponent) {
    node.parentComponent = parentComponent;
}

function render(node: VInput, htmlId: string) {
    transactionStart();
    const rootId = htmlId as RootId;
    const id = (htmlId as unknown) as ID;
    const rootNode = node as VComponentNodeCreated;
    const oldNode = roots.get(rootId);
    assert(commandList.length === 0);
    isUpdating = oldNode !== undefined;
    if (oldNode === undefined) {
        addCommand(rootNode, {action: 'start', group: 'mount', rootId: rootId});
    }
    const newNode =
        oldNode === undefined ? mountVNode(rootId, rootNode, id, null) : updateVNode(rootId, rootNode, oldNode, id);
    if (oldNode === undefined) {
        addCommand(newNode, {action: 'end', group: 'mount', rootId: rootId});
    }
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
    if (!rootSuspended) {
        roots.set(rootId, newNode);
    }
    commitUpdating();
    return newNode;
}

function unmountComponentAtNode(htmlId: string) {
    transactionStart();
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

function transactionStart() {
    rootSuspended = false;
    now = Date.now();
    for (const [, root] of roots) {
        visitEachNode(root, node => {
            assert(node.status === 'active');
        });
    }
}

function commitUpdating() {
    for (const {newChild, isRestart, node} of updatedComponents) {
        assert(node.status === 'active');
        assert(newChild.status === 'active');
        if (!rootSuspended) {
            node.state.node = node;
            if (isRestart) {
                (node as VComponentNodeCreated).children = newChild;
                hooks.restartComponent(node);
                if (process.env.NODE_ENV === 'development') {
                    const unmounted = [];
                    for (const node of maybeRemoved) {
                        unmounted.push(getPersistId(node));
                    }
                    const devToolsCommand: UpdateDevtools = {
                        action: 'update',
                        group: 'devtools',
                        isRoot: false,
                        unmounted: unmounted,
                        node: convertVNodeToDevToolsJSON(node),
                    };
                    commandList.push(devToolsCommand);
                }
            }
        }
    }
    // console.log({maybeRemoved, maybeObsolete, maybeCancelled});
    for (const node of maybeRemoved) {
        assert(node.status === 'active');
        if (!rootSuspended) {
            (node as VNodeCreated).status = 'removed';
            destroyVNode(node);
        }
    }
    for (const node of maybeObsolete) {
        assert(node.status === 'active' || node.status === 'removed');
        if (!rootSuspended) {
            (node as VNodeCreated).status = 'obsolete';
            destroyVNode(node);
        }
    }
    for (const node of maybeCancelled) {
        assert(node.status === 'active');
        if (rootSuspended) {
            node.status = 'cancelled';
            destroyVNode(node);
        }
    }
    for (const {newParent, node} of maybeUpdatedParent) {
        assert(node.status === 'active');
        if (!rootSuspended) {
            (node as VNodeCreated).parentComponent = newParent;
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
    if (filteredCommands.length > 0) {
        sendCommands(filteredCommands);
    }

    for (const [, root] of roots) {
        if (root.status === 'removed') {
            visitEachNode(root, node => {
                assert(node.status === 'removed');
            });
        } else {
            visitEachNode(root, node => {
                assert(node.status === 'active');
            });
        }
    }
    commandList = [];
    updatedComponents = [];
    maybeObsolete = [];
    maybeRemoved = [];
    maybeCancelled = [];
    maybeUpdatedParent = [];
    rootSuspended = false;
}

function destroyVNode(node: VNodeCreated) {
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

function disposeVDomNodeCallbacks(node: VDomNodeCreated) {
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
exports.getNodeRootId = findRootId;
