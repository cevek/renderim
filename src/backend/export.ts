function createElement<T extends object>(
    type: string | ((props: T) => VInput),
    p: T & {withCommand?: JSX.AttrsCommand} | null,
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
        throw new Error('Component type is empty: ' + type);
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
    if (oldNode === undefined) {
        isMounting = true;
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
    if (oldNode === undefined || !rootSuspended) {
        roots.set(rootId, newNode);
    }
    commitUpdating();
    return newNode.status === 'removed' ? undefined : newNode;
}

function unmountComponentAtNode(htmlId: string) {
    transactionStart();
    unmount(htmlId as RootId);
    commitUpdating();
}
function unmount(htmlId: RootId) {
    const node = roots.get(htmlId);
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
        roots.delete(htmlId);
    }
}

function transactionStart() {
    rootSuspended = false;
    now = Date.now();
    trxId++;
    for (const [, root] of roots) {
        visitEachNode(root, node => {
            if (node.kind === componentKind) {
                assert(node.state.node === node);
            }
            assert(node.status === 'active');
        });
    }
}

function commitUpdating(): void {
    const shouldCancel = !isMounting && rootSuspended;
    for (const up of updatings) {
        const {node} = up;
        if (node.status === 'obsolete' && up.kind === 'updateComponent') {
            continue;
        }
        if (shouldCancel) {
            if (up.kind === 'created') {
                const {node} = up;
                if (node.kind === componentKind) {
                    hooks.cancelComponent(node);
                }
                node.status = 'cancelled';
                destroyVNode(node);
            }
            continue;
        }
        if (up.kind !== 'restart') {
            assert(node.status === 'active');
        }
        if (up.kind === 'obsolete') {
            (node as VNodeCreated).status = 'obsolete';
            destroyVNode(node);
        } else if (up.kind === 'removed') {
            if (node.kind === componentKind) {
                processBoundarySubcomponentRemoved(node);
            }
            (node as VNodeCreated).status = 'removed';
            destroyVNode(node);
        } else if (up.kind === 'restart') {
            const {newChild} = up;
            const node = up.node.state.node;
            assert(node.status === 'active');
            assert(newChild.status === 'active');
            (node as VComponentNodeCreated).children = newChild;
            hooks.restartComponent(node);
            if (process.env.NODE_ENV === 'development') {
                const unmounted = [];
                for (const up2 of updatings) {
                    if (up2.kind === 'removed') {
                        unmounted.push(getPersistId(node));
                    }
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
        } else if (up.kind === 'updateComponent') {
            const {node} = up;
            node.state.node = node;
        } else if (up.kind === 'parent') {
            const {newParent} = up;
            (node as VNodeCreated).parentComponent = newParent;
        } else if (up.kind === 'created') {
        } else {
            never(up);
        }
    }

    const prevUpdatings = updatings;
    updatings = [];
    rootSuspended = false;
    isMounting = false;

    if (schedule.length > 0) {
        const cb = schedule.shift()!;
        transactionStart();
        cb();
        commitUpdating();
        return;
    }

    for (const [, root] of roots) {
        if (root.status === 'removed') {
            visitEachNode(root, node => {
                assert(node.status === 'removed');
            });
        } else {
            visitEachNode(root, node => {
                if (node.kind === componentKind) {
                    assert(node.state.node === node);
                }
                assert(node.status === 'active');
            });
        }
    }
    const filteredCommands = filterObsoleteCommands(commandList);
    if (filteredCommands.length > 0) {
        sendCommands(filteredCommands);
    }
    commandList = [];
}

function filterObsoleteCommands(commandList: Command[]) {
    return (commandList as CommandWithParentVNode[]).filter(command => {
        const vNode = command.vNode;
        if (vNode === undefined) return true;
        let skip = vNode.status === 'cancelled';
        if (command.action === 'remove' && vNode.status !== 'removed') {
            skip = true;
        }
        command.vNode = undefined!;
        return !skip;
    });
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

function getCurrentComponent<T extends ComponentState>() {
    if (currentComponent === undefined) throw new Error('No current component');
    return currentComponent as T;
}

function cancelUpdating() {
    rootSuspended = true;
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

exports.setHook = function setHook<K extends keyof typeof hooks>(type: K, value: typeof hooks[K]) {
    hooks[type] = value;
};
exports.IntersectionObserverElement = IntersectionObserverElement;

exports.loadClientScript = loadClientScript;

exports.getNodeRootId = findRootId;
exports.scheduleUpdate = scheduleUpdate;
exports.CancellationToken = CancellationToken;
exports.cancelUpdating = cancelUpdating;
