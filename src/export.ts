function createElement(type: string | ComponentFun, props: object | null, ...children: Return[]): VElement {
    const key = props === null ? undefined : (props as {key?: string}).key;
    if (typeof type === 'string') {
        return createDomVNode(type, createPropsFromObj(props), key, children);
    } else if (typeof type === 'function') {
        if (props === null) props = {children};
        else (props as {children?: Return}).children = children;
        return createComponentVNode(type, props, key);
    } else {
        throw new Error('Component type is empty: ' + type);
    }
}

function render(node: VElement, htmlId: string) {
    currentComponent = rootSuspense;

    const rootSuspenseNode = createComponentVNode(Suspense, {
        fallback: 'Root Loading...',
        timeout: 0,
        children: node,
    });
    const rootNode = createComponentVNode(ErrorBoundary, {
        children: rootSuspenseNode,
        fallback: (props: {errors: Error[]}) => {
            console.error(props.errors);
            return 'Something went wrong';
        },
    });

    const id = (htmlId as unknown) as ID;
    const oldNode = roots.get(id);
    assert(commandList.length === 0);
    const newNode = oldNode === undefined ? mountVNode(rootNode, id, null) : updateVNode(rootNode, oldNode, id);
    roots.set(id, newNode);
    commitUpdating();
    console.log('after render state', toJSON(newNode));
    // console.log(JSON.stringify(toJSON(newNode), null, 2));
    visitEachNode(newNode, n => assert(n.status === 'active'));
    if (oldNode !== undefined) {
        //todo:
        // visitEachNode(node, n => assert(n.status === 'obsolete' || n.status === 'removed'));
    }
}

function unmount(htmlId: string) {
    const node = roots.get((htmlId as unknown) as ID);
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
            oldNode.children = newNode.children;
        } else {
        }
    }
    console.log({maybeRemoved, maybeObsolete, maybeCancelled});
    for (const node of maybeRemoved) {
        assert(node.status === 'active');
        if (!shouldCancel(node)) {
            node.status = 'removed';
            GCVNodes.removed.add(node);
        }
    }
    for (const node of maybeObsolete) {
        assert(node.status === 'active' || node.status === 'removed');
        if (!shouldCancel(node)) {
            node.status = 'obsolete';
            GCVNodes.obsolete.add(node);
        }
    }
    for (const node of maybeCancelled) {
        assert(node.status === 'active');
        if (shouldCancel(node)) {
            node.status = 'cancelled';
            GCVNodes.cancelled.add(node);
        }
    }
    for (const {newParent, node} of maybeUpdatedParent) {
        assert(node.status === 'active');
        if (!shouldCancel(node)) {
            node.parentComponent = newParent;
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

    assert(currentComponent === rootSuspense);
}

function getCurrentComponentNode() {
    if (currentComponent === undefined) throw new Error('No current component');
    return currentComponent;
}
