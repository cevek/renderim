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
    const oldNode = GLOBAL_ROOTS.get(rootId);
    assert(GLOBAL_COMMAND_LIST.length === 0);
    if (oldNode === undefined) {
        GLOBAL_MOUNTING = true;
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
        GLOBAL_COMMAND_LIST.push(devToolsCommand);
    }
    if (oldNode === undefined || !GLOBAL_UPDATE_CANCELLED) {
        GLOBAL_ROOTS.set(rootId, newNode);
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
    const node = GLOBAL_ROOTS.get(htmlId);
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
        visitEachNode(root, node => {
            if (node.kind === componentKind) {
                assert(node.state.node === node);
            }
            assert(node.status === 'active');
        });
    }
}

function commitUpdating(): void {
    const shouldCancel = !GLOBAL_MOUNTING && GLOBAL_UPDATE_CANCELLED;
    for (const up of GLOBAL_TASKS) {
        const {node} = up;
        if (node.status === 'obsolete' && up.kind === 'updateComponent') {
            continue;
        }
        if (shouldCancel) {
            if (up.kind === 'created') {
                const {node} = up;
                if (node.kind === componentKind) {
                    GLOBAL_HOOKS.cancelComponent(node);
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
            GLOBAL_HOOKS.restartComponent(node);
            if (process.env.NODE_ENV === 'development') {
                const unmounted = [];
                for (const up2 of GLOBAL_TASKS) {
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
                GLOBAL_COMMAND_LIST.push(devToolsCommand);
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

    const prevUpdatings = GLOBAL_TASKS;
    GLOBAL_TASKS = [];
    GLOBAL_UPDATE_CANCELLED = false;
    GLOBAL_MOUNTING = false;

    if (GLOBAL_SCHEDULE.length > 0) {
        const cb = GLOBAL_SCHEDULE.shift()!;
        transactionStart();
        cb();
        commitUpdating();
        return;
    }

    for (const [, root] of GLOBAL_ROOTS) {
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
    const filteredCommands = filterObsoleteCommands(GLOBAL_COMMAND_LIST);
    if (filteredCommands.length > 0) {
        sendCommands(filteredCommands);
    }
    GLOBAL_COMMAND_LIST = [];
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
        GLOBAL_HOOKS.unmountComponent(node);
    }
    if (GLOBAL_DEV_GC_VNODES !== undefined) {
        GLOBAL_DEV_GC_VNODES.add(node);
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
    if (GLOBAL_CURRENT_COMPONENT === undefined) throw new Error('No current component');
    return GLOBAL_CURRENT_COMPONENT as T;
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

exports.setHook = function setHook<K extends keyof typeof GLOBAL_HOOKS>(type: K, value: typeof GLOBAL_HOOKS[K]) {
    GLOBAL_HOOKS[type] = value;
};
exports.IntersectionObserverElement = IntersectionObserverElement;

exports.loadClientScript = loadClientScript;

exports.getNodeRootId = findRootId;
exports.scheduleUpdate = scheduleUpdate;
exports.CancellationToken = CancellationToken;
exports.cancelUpdating = cancelUpdating;
