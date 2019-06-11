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
            addPromiseToParentSuspense(node, err);
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

function restartComponent(node: VComponentNode | VComponentNodeCreated): boolean {
    if (node.status === 'removed' || node.status === 'cancelled' || node.status === 'obsolete') return false;
    const oldNode = node as VComponentNode;
    console.log('restart', node);
    assert(node.status === 'active');
    visitEachNode(node, n => assert(n.status === 'active'));
    assert(typeof node.parentComponent !== 'string');

    const newNode = updateVNode(
        node.parentComponent,
        createComponentVNode(node.type, node.props, node.key),
        oldNode,
        node.id,
    ) as VComponentNode;
    assert(newNode.kind === componentKind);
    maybeRestarted.push({newNode: newNode, oldNode: oldNode});
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
    const state = node.state;
    assert(state.components.length === state.promises.length);
    assert(state.resolvedPromises <= state.promises.length);
    // const prevPromisesLen = state.promises.length;
    node.children = mountOrUpdate(node, norm(node.children), oldChild, parentId, beforeId);
    // if (state.promises.length === 0) {
    // const newChildren = mountOrUpdate(norm(node.children), oldChild, parentId, beforeId);
    // node.children = undefined;
    if (state.promises.length === 0) {
        // node.children = newChildren;
    } else {
        const fragmentArray = (node.children as VComponentNodeCreated).children as VArrayNodeCreated;
        const suspenseContent = fragmentArray.children[1] as VComponentNodeCreated;
        assert(suspenseContent.type === SuspenseContent);
        if (oldChild === undefined) {
            // fragmentArray.children[1] = mountVNode(fragmentArray, norm(null), parentId, beforeId);
            suspenseContent.children = mountVNode(suspenseContent, norm(null), parentId, beforeId);
        } else {
            const oldSuspenseContent = (oldChild.children as VArrayNode).children[1] as VComponentNode;
            assert(oldSuspenseContent.type === SuspenseContent);
            suspenseContent.children = updateVNode(
                suspenseContent,
                oldSuspenseContent.children as VComponentNodeCreated,
                oldSuspenseContent.children,
                parentId,
            );
        }
        if (state.timeoutAt > Date.now()) {
            addPromiseToParentSuspense(
                node,
                Promise.race([Promise.all(state.promises), sleep(state.timeoutAt - Date.now() + 1)]),
            );
        } else {
        }
    }
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

function restartSuspense(node: VSuspenseNodeCreated) {
    console.log('restartSuspense', node);
    const state = node.state;
    assert(state.components.length === state.promises.length);
    assert(state.resolvedPromises <= state.promises.length);
    for (const component of state.components) {
        // if (component.type === Suspense) {
        //     restartSuspense(component as VSuspenseNodeCreated);
        // } else {
        restartComponent(component);
        // }
    }
    if (state.resolvedPromises === state.promises.length) {
        state.promises = [];
        state.promisesSet.clear();
        state.components = [];
        state.resolvedPromises = 0;
        return restartComponent(node);
    }
    return false;
}

function addPromiseToParentSuspense(component: VComponentNodeCreated, promise: Promise<unknown>) {
    const suspenseContent = nonNull(findSuspense(component));
    const suspense = suspenseContent.parentComponent.parentComponent.parentComponent;
    if (suspense.state.promisesSet.has(promise)) return;
    if (suspense.state.promisesSet.size === 0) {
        setTimeout(() => {
            // restartComponent(suspense);
        });
    }
    console.log('add promise to suspense', suspense, promise);
    suspense.state.promisesSet.add(promise);
    assert(suspense.status === 'active' || suspense.status === 'created');
    assert(component.status === 'created');
    if (suspense.state.promises.length === 0) {
        suspense.state.timeoutAt = Date.now() + suspense.props.timeout;
    }
    suspense.state.promises.push(promise.catch(noop));
    suspense.state.components.push(component);
    const currentPromises = suspense.state.promises.slice();
    // debugger;
    // visitEachNode(suspense, n => console.log(n.status));
    Promise.all(currentPromises).then(() => {
        if (suspense.status !== 'active') return;
        // todo: check actual id
        suspense.state.resolvedPromises = currentPromises.length;
        const restarted = restartSuspense(suspense);
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

function findSuspense(node: VNode | VNodeCreated) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === SuspenseContent) {
            const ret = n as VSuspenseContentNodeCreated;
            assert(ret.parentComponent.parentComponent.parentComponent.type === Suspense);
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
