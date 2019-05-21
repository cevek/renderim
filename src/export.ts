function createElement(type: string | ComponentFun, props: object | null, ...children: Return[]): VElement {
    const key = props === null ? undefined : (props as {key?: string}).key;
    if (typeof type === 'string') {
        return createDomVNode(type, props, key, children);
    } else if (typeof type === 'function') {
        if (props === null) props = {children};
        else (props as {children?: Return}).children = children;
        return createComponentVNode(type, props, key);
    } else {
        throw new Error('Component type is empty: ' + type);
    }
}

function render(node: VNode, htmlId: string) {
    currentSuspense = rootSuspense;
    currentErrorBoundary = rootErrorBoundary;

    const rootSuspenseNode = createComponentVNode(Suspense, {
        fallback: 'Root Loading...',
        timeout: 0,
        children: node,
    });
    rootSuspenseNode.suspense = Object.freeze({}) as VSuspenseNode;
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
    console.log(JSON.stringify(toJSON(newNode), null, 2));
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
    return node.suspense.extra.promises.length > 0 || node.errorBoundary.extra.errors.length > 0;
}
function commitUpdating() {
    for (const {oldNode, newNode} of maybeRestarted) {
        assert(oldNode.status === 'active');
        assert(newNode.status === 'active');
        if (!shouldCancel(oldNode)) {
            oldNode.children = newNode.children;
            oldNode.suspense = newNode.suspense;
            oldNode.errorBoundary = newNode.errorBoundary;
            // oldNode.status = 'obsolete';
        } else {
            // newNode.status = 'cancelled';
            // GCVNodes.cancelledComponents.add(newNode);
        }
    }
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
        // todo: removed???
        assert(node.status === 'active' || node.status === 'removed');
        if (shouldCancel(node)) {
            node.status = 'cancelled';
            GCVNodes.cancelled.add(node);
        }
    }
    maybeRestarted = [];
    maybeObsolete = [];
    maybeRemoved = [];
    maybeCancelled = [];
    console.log(commandList);
    const filteredCommands = (commandList as CommandWithParentVNode[]).filter(command => {
        const skip = command.vNode.status === 'cancelled';
        command.vNode = undefined!;
        return !skip;
    });
    commandList = [];
    setTimeout(() => {
        filteredCommands;
        renderCommands(filteredCommands);
    });

    assert(currentSuspense === rootSuspense);
    assert(currentErrorBoundary === rootErrorBoundary);
}
