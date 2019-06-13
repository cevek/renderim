function runComponent(node: VComponentNodeCreated) {
    assert(node.status === 'created');
    currentComponent = node;
    try {
        hooks.beforeComponent(node);
        node.children = norm(node.type(node.props));
        hooks.afterComponent(node);
    } catch (err) {
        hooks.afterComponent(node);
        node.children = norm(undefined);
        if (err instanceof Promise) {
            setPromiseToParentSuspense(node, err);
        } else if (err instanceof AssertError) {
            throw err;
        } else {
            new Promise(() => {
                node.type(node.props);
            });
            addErrorToParentBoundary(node, err);
        }
    } finally {
        currentComponent = undefined;
    }
}

function restartComponent(node: VComponentNode): boolean {
    // (node as VNodeCreated).status === 'cancelled' ||
    if (node.status === 'removed' || node.status === 'obsolete') return false;
    console.log('restart', node);
    assert(node.status === 'active');
    visitEachNode(node, n => assert(n.status === 'active'));
    currentComponent = node;
    const newChildren = norm(node.type(node.props));
    currentComponent = undefined;
    const newChild = updateVNode(node, newChildren, node.children, node.id) as VComponentNode;
    updatedComponents.push({newChild, node});
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
        node.children = mountOrUpdate(
            node,
            createComponentVNode(node.props.fallback, {errors: node.state.errors}),
            oldChild,
            parentId,
            beforeId,
        );
    }
    if (node.state.errors.length === 0) {
        node.children = mountOrUpdate(node, norm(node.children), oldChild, parentId, beforeId);
    }
    return node;
}

function handleSuspense(node: VSuspenseNodeCreated, oldChild: VNode | undefined, parentId: ID, beforeId: ID | null) {
    assert(node.status === 'created');
    node.children = mountOrUpdate(node, norm(node.children), oldChild, parentId, beforeId);
    return node;
}

function setPromiseToParentSuspense(component: VComponentNodeCreated, promise: Promise<unknown>) {
    if (!rootSuspended && findSuspenseShield(component) === undefined) {
        rootSuspended = true;
    }
    const suspense = findSuspense(component);
    if (suspense === undefined) {
        console.log('add promise to global suspense', promise);
        globalSuspense.version++;
        globalSuspense.components.set(component, promise);
        resolveSuspensePromises(globalSuspense).then(() => {
            restartSuspense(globalSuspense, undefined);
        });
        return;
    }
    const state = suspense.state;
    console.log('add promise to suspense', suspense, promise);
    assert(suspense.status === 'active' || suspense.status === 'created');
    assert(component.status === 'created');
    if (state.components.size === 0) {
        if (suspense.props.timeout === 0) {
            setTimeout(() => {
                transactionStart();
                restartComponent(suspense as VComponentNode);
                commitUpdating();
            });
        }

        state.timeoutAt = now + suspense.props.timeout;
    }
    state.version++;
    state.components.set(component, promise);
    if (state.timeoutAt > now) {
        setPromiseToParentSuspense(
            suspense,
            Promise.race([Promise.all([...state.components.values()]), sleep(state.timeoutAt - now + 1)]),
        );
    }
    resolveSuspensePromises(state).then(() => {
        restartSuspense(state, suspense);
    });
}

function restartSuspense(state: SuspenseState, suspense: VSuspenseNodeCreated | undefined) {
    transactionStart();
    let lastVersion = state.version;
    for (const [component] of state.components) {
        restartComponent(component as VComponentNode);
    }
    if (state.version === lastVersion) {
        state.components.clear();
        if (suspense !== undefined) {
            restartComponent(suspense as VComponentNode);
        }
    }
    commitUpdating();
}

function resolveSuspensePromises(state: SuspenseState): Promise<void> {
    const promises = [...state.components.values()];
    const lastVersion = state.version;
    return Promise.all(promises).then(() => {
        if (state.version !== lastVersion) {
            return resolveSuspensePromises(state);
        }
    });
}

function addErrorToParentBoundary(component: VComponentNodeCreated, error: Error) {
    const errorBoundary = findErrorBoundary(component);
    errorBoundary.state.errors.push(error);
    assert(errorBoundary.status === 'active' || errorBoundary.status === 'created');
    assert(component.status === 'created');
    Promise.resolve().then(() => {
        transactionStart();
        restartComponent(errorBoundary as VComponentNode);
        commitUpdating();
    });
}

function findSuspenseShield(node: VNode | VNodeCreated) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (
            n.type === Suspense &&
            is<VSuspenseNodeCreated>(n) &&
            (n.state.components.size === 0 || n.state.timeoutAt < now)
        ) {
            return n;
        }
        n = n.parentComponent;
    }
}
function findSuspense(node: VNode | VNodeCreated) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === Suspense && is<VSuspenseNodeCreated>(n)) {
            return n;
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
