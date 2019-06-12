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
    const oldNode = node as VComponentNode;
    console.log('restart', node);
    assert(node.status === 'active');
    visitEachNode(node, n => assert(n.status === 'active'));
    // assert(typeof node.parentComponent !== 'string');
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
    // const state = node.state;
    // const prevPromisesLen = state.promises.length;
    // const newChild = mountOrUpdate(node, norm(node.children), oldChild, parentId, beforeId);
    // if (oldChild !== undefined) {
    // updatedComponents.push({node: node as VComponentNode, newChild});
    // } else {
    node.children = mountOrUpdate(node, norm(node.children), oldChild, parentId, beforeId);
    // }

    // if (state.promises.length === 0) {
    // const newChildren = mountOrUpdate(norm(node.children), oldChild, parentId, beforeId);
    // node.children = undefined;
    // if (state.components.size === 0) {
    //     // node.children = newChildren;
    // } else {
    //     const fragmentArray = (node.children as VComponentNodeCreated).children as VArrayNodeCreated;
    //     const suspenseContent = fragmentArray.children[1] as VComponentNodeCreated;
    //     assert(suspenseContent.type === SuspenseContent);
    //     if (oldChild === undefined) {
    //         // fragmentArray.children[1] = mountVNode(fragmentArray, norm(null), parentId, beforeId);
    //         // suspenseContent.children = mountVNode(suspenseContent, norm(null), parentId, beforeId);
    //     } else {
    //         const oldSuspenseContent = (oldChild.children as VArrayNode).children[1] as VComponentNode;
    //         assert(oldSuspenseContent.type === SuspenseContent);
    //         suspenseContent.children = updateVNode(
    //             suspenseContent,
    //             oldSuspenseContent.children as VComponentNodeCreated,
    //             oldSuspenseContent.children,
    //             parentId,
    //         );
    //     }
    //     // if (state.timeoutAt > Date.now()) {
    //     //     setPromiseToParentSuspense(
    //     //         node,
    //     //         Promise.race([Promise.all(state.promises), sleep(state.timeoutAt - Date.now() + 1)]),
    //     //     );
    //     // } else {
    //     // }
    // }
    // }
    // if (node.children === undefined) {
    //     if (oldChild === undefined) {
    //         node.children = mountVNode(norm(null), parentId, beforeId);
    //     } else {
    //         node.children = oldChild;
    //     }
    // }
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
        resolveSuspensePromises(globalSuspense).then(commitUpdating);
        return;
    }
    const state = suspense.state;
    if (state.components.has(component)) return;
    console.log('add promise to suspense', suspense, promise);
    assert(suspense.status === 'active' || suspense.status === 'created');
    assert(component.status === 'created');
    if (state.components.size === 0) {
        // setTimeout(() => {
        //     // restartComponent(suspense);
        //     // commitUpdating();
        // });
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
        restartComponent(suspense as VComponentNode);
        commitUpdating();
    });
}

function resolveSuspensePromises(state: SuspenseState): Promise<void> {
    const promises = [...state.components.values()];
    const lastVersion = state.version;
    return Promise.all(promises).then(() => {
        now = Date.now();
        if (state.version !== lastVersion) {
            return resolveSuspensePromises(state);
        }
        for (const [component] of state.components) {
            restartComponent(component as VComponentNode);
        }
        state.components.clear();
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
