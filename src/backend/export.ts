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
        const propsChildren = children.length === 1 ? children[0] : children;
        if (props === null) props = {children: propsChildren};
        else props.children = propsChildren;
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
    }
    commitUpdating();
    console.log('after render state', toJSON(newNode));
    // console.log(JSON.stringify(toJSON(newNode), null, 2));
    visitEachNode(newNode, n => assert(n.status === 'active'));
    if (oldNode !== undefined) {
        //todo:
        // visitEachNode(node, n => assert(n.status === 'obsolete' || n.status === 'removed'));
    } else {
    }
}

function unmountComponentAtNode(htmlId: string) {
    const node = roots.get(htmlId as RootId);
    if (node !== undefined) {
        removeVNode(node, true);
    }
}

function shouldCancel(node: VNode | VNodeCreated) {
    return findSuspense(node).extra.promises.length > 0; // || node.errorBoundary.extra.errors.length > 0;
}
function commitUpdating() {
    for (const {oldNode, newNode} of maybeRestarted) {
        assert(oldNode.status === 'active');
        assert(newNode.status === 'active');
        if (!shouldCancel(oldNode)) {
            (oldNode as NoReadonly<VComponentNode>).children = newNode.children;
        } else {
        }
    }
    // console.log({maybeRemoved, maybeObsolete, maybeCancelled});
    for (const node of maybeRemoved) {
        assert(node.status === 'active');
        if (!shouldCancel(node)) {
            (node as NoReadonly<VNode>).status = 'removed';
            disposeVDomNodeCallbacks(node);
            GCVNodes.removed.add(node);
        }
    }
    for (const node of maybeObsolete) {
        assert(node.status === 'active' || node.status === 'removed');
        if (!shouldCancel(node)) {
            (node as NoReadonly<VNode>).status = 'obsolete';
            disposeVDomNodeCallbacks(node);
            GCVNodes.obsolete.add(node);
        }
    }
    for (const node of maybeCancelled) {
        assert(node.status === 'active');
        if (shouldCancel(node)) {
            node.status = 'cancelled';
            disposeVDomNodeCallbacks(node);
            GCVNodes.cancelled.add(node);
        }
    }
    for (const {newParent, node} of maybeUpdatedParent) {
        assert(node.status === 'active');
        if (!shouldCancel(node)) {
            (node as NoReadonly<VNode>).parentComponent = newParent;
        }
    }
    const filteredCommands = (commandList as CommandWithParentVNode[]).filter(command => {
        let skip = command.vNode.status === 'cancelled';
        if (command.action === 'remove' && command.vNode.status !== 'removed') {
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

function disposeVDomNodeCallbacks(node: VNodeCreated | VNode) {
    if (node.kind === domKind) {
        const attrs = node.props;
        for (const attr in attrs) {
            const value = attrs[attr];
            if (typeof value === 'function') {
                disposeCallback(value)
            }
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
