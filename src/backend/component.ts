function runComponent(node: VComponentNodeCreated) {
    assert(node.status === 'created');
    try {
        hooks.beforeComponent(node);
        node.children = norm(node.type(node.props));
        hooks.afterComponent(node);
    } catch (err) {
        hooks.afterComponent(node);
        node.children = norm(undefined);
        if (err instanceof Promise) {
            addPromiseToParentSuspense(node, err);
        } else if (err instanceof AssertError) {
            throw err;
        } else {
            new Promise(() => {
                node.type(node.props);
            });
            addErrorToParentBoundary(node, err);
        }
    }
}

function restartComponent(node: VComponentNode | VComponentNodeCreated): boolean {
    if (node.status === 'removed' || node.status === 'cancelled' || node.status === 'obsolete') return false;
    const oldNode = node as VComponentNode;
    console.log('restart', node);
    assert(node.status === 'active');
    visitEachNode(node, n => assert(n.status === 'active'));

    const prevCurrentComponent = currentComponent;
    assert(typeof node.parentComponent !== 'string');
    currentComponent = node.parentComponent as VComponentNode;

    const newNode = updateVNode(
        createComponentVNode(node.type, node.props, node.key),
        oldNode,
        node.id,
    ) as VComponentNode;
    assert(newNode.kind === componentKind);
    maybeRestarted.push({newNode: newNode, oldNode: oldNode});

    currentComponent = prevCurrentComponent;
    return true;
}

function handleErrorBoundary(
    node: VErrorBoundaryNodeCreated,
    oldChild: VNode | undefined,
    parentId: ID,
    beforeId: ID | null,
) {
    assert(node.status === 'created');
    if (node.state.errors.length > 0) {
        assert(typeof node.parentComponent !== 'string');
        currentComponent = node.parentComponent as VComponentNode;
        node.children = mountOrUpdate(
            createComponentVNode(node.props.fallback, {errors: node.state.errors}),
            oldChild,
            parentId,
            beforeId,
        );
        currentComponent = node;
    }
    if (node.state.errors.length === 0) {
        node.children = mountOrUpdate(norm(node.children), oldChild, parentId, beforeId);
    }
    return node;
}

function handleSuspense(node: VSuspenseNodeCreated, oldChild: VNode | undefined, parentId: ID, beforeId: ID | null) {
    assert(node.status === 'created');
    const state = node.state;
    assert(state.components.length === state.promises.length);
    if (state.promises.length > 0) {
        for (const component of state.components) {
            restartComponent(component);
        }
        if (state.resolvedPromises === state.promises.length) {
            state.promises = [];
            state.components = [];
            state.resolvedPromises = 0;
        }
    }
    // if (state.promises.length === 0) {
    const newChildren = mountOrUpdate(norm(node.children), oldChild, parentId, beforeId);
    node.children = undefined;
    if (state.promises.length === 0) {
        node.children = newChildren;
    } else {
        if (state.timeoutAt > Date.now()) {
            addPromiseToParentSuspense(
                node,
                Promise.race([Promise.all(state.promises), sleep(state.timeoutAt - Date.now() + 1)]),
            );
        } else {
            node;
            // setTimeout(() => restartComponent(node));
        }
    }
    // }
    if (node.children === undefined) {
        if (oldChild === undefined) {
            node.children = mountVNode(norm(null), parentId, beforeId);
        } else {
            node.children = oldChild;
        }
    }
    return node;
}

function addPromiseToParentSuspense(component: VComponentNodeCreated, promise: Promise<unknown>) {
    const suspenseContent = nonNull(findSuspense(component));
    const suspense = suspenseContent.parentComponent.parentComponent;
    assert(suspense.status === 'active' || suspense.status === 'created');
    assert(component.status === 'created');
    if (suspense.state.promises.length === 0) {
        suspense.state.timeoutAt = Date.now() + suspense.props.timeout;
    }
    suspense.state.promises.push(promise.catch(noop));
    suspense.state.components.push(component);
    const currentPromises = suspense.state.promises;
    console.log('add promise to suspense', suspense);
    // debugger;
    // visitEachNode(suspense, n => console.log(n.status));
    Promise.all(currentPromises).then(() => {
        // todo: check actual id
        suspense.state.resolvedPromises = currentPromises.length;
        const restarted = restartComponent(suspense);
        if (restarted) {
            commitUpdating();
        }
    });
}

function addErrorToParentBoundary(component: VComponentNodeCreated, error: Error) {
    const errorBoundary = findErrorBoundary(component);
    errorBoundary.state.errors.push(error);
    assert(errorBoundary.status === 'active' || errorBoundary.status === 'created');
    assert(component.status === 'created');
    Promise.resolve().then(() => {
        const restarted = restartComponent(errorBoundary);
        if (restarted) {
            commitUpdating();
        }
    });
}

const defaultSuspenseState: SuspenseState = {
    componentId: 0,
    components: [],
    promises: [],
    resolvedPromises: 0,
    timeoutAt: 0,
};
function findSuspense(node: VNode | VNodeCreated) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === SuspenseContent) {
            const ret = n as VSuspenseContentNodeCreated;
            assert(ret.parentComponent.parentComponent.type === Suspense);
            return ret;
        }
        n = n.parentComponent;
    }
}

function findErrorBoundary(node: VNode | VNodeCreated) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === ErrorBoundary) return n as VErrorBoundaryNodeCreated;
        n = n.parentComponent;
    }
    return never();
}

function findRootId(node: VNode | VNodeCreated): RootId {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        n = n.parentComponent;
    }
    return n;
}
