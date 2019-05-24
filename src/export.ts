function createElement(type: string | ComponentFun, props: object | null, ...children: Return[]): VElement {
    const key = props === null ? undefined : (props as {key?: string}).key;
    if (typeof type === 'string') {
        return createDomVNode(type, createPropsFromObj(props), key, children);
    } else if (typeof type === 'function') {
        if (children.length === 1) children = children[0] as Return[];
        if (props === null) props = {children};
        else (props as {children?: Return}).children = children;
        return createComponentVNode(type, props, key);
    } else {
        throw new Error('Component type is empty: ' + type);
    }
}

function render(node: VElement, htmlId: string) {
    const rootId = htmlId as RootId;

    currentComponent = createComponentVNode(Suspense, {
        fallback: 'Root Loading...',
        timeout: 0,
        children: node,
    });
    (currentComponent as NoReadonly<VComponentNode>).parentComponent = rootId;
    freeze(currentComponent);

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
        addCommand(rootNode, {type: 'mountStart', rootId: rootId});
    }
    const newNode =
        oldNode === undefined
            ? mountVNode(rootNode, (rootId as unknown) as ID, null)
            : updateVNode(rootNode, oldNode, (rootId as unknown) as ID);
    roots.set(rootId, newNode);
    if (oldNode === undefined) {
        addCommand(newNode, {type: 'mountEnd', rootId: rootId});
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

function unmount(htmlId: string) {
    const node = roots.get(htmlId as RootId);
    if (node !== undefined) {
        removeVNode(node, true);
    }
}

function shouldCancel(node: VNode) {
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
    console.log({maybeRemoved, maybeObsolete, maybeCancelled});
    for (const node of maybeRemoved) {
        assert(node.status === 'active');
        if (!shouldCancel(node)) {
            (node as NoReadonly<VNode>).status = 'removed';
            GCVNodes.removed.add(node);
        }
    }
    for (const node of maybeObsolete) {
        assert(node.status === 'active' || node.status === 'removed');
        if (!shouldCancel(node)) {
            (node as NoReadonly<VNode>).status = 'obsolete';
            GCVNodes.obsolete.add(node);
        }
    }
    for (const node of maybeCancelled) {
        assert(node.status === 'active');
        if (shouldCancel(node)) {
            (node as NoReadonly<VNode>).status = 'cancelled';
            GCVNodes.cancelled.add(node);
        }
    }
    for (const {newParent, node} of maybeUpdatedParent) {
        assert(node.status === 'active');
        if (!shouldCancel(node)) {
            (node as NoReadonly<VNode>).parentComponent = newParent;
        }
    }
    maybeRestarted = [];
    maybeObsolete = [];
    maybeRemoved = [];
    maybeCancelled = [];
    maybeUpdatedParent = [];
    const filteredCommands = (commandList as CommandWithParentVNode[]).filter(command => {
        const skip = command.vNode.status === 'cancelled';
        command.vNode = undefined!;
        return !skip;
    });
    commandList = [];
    renderCommands(filteredCommands);
}

function getCurrentComponentNode() {
    if (currentComponent === undefined) throw new Error('No current component');
    return currentComponent;
}
