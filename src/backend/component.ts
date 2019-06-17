function runComponent(node: VComponentNodeCreated) {
    assert(node.status === 'created' || node.status === 'active');
    currentComponent = node;
    let newChildren;
    try {
        hooks.beforeComponent(node);
        newChildren = norm(node.type(node.props));
        hooks.afterComponent(node);
    } catch (err) {
        hooks.afterComponent(node);
        newChildren = norm(undefined);
        let foundHandler = false;
        let n = node.parentComponent;
        while (typeof n !== 'string') {
            if (n.type === Boundary && is<VComponentType<typeof Boundary>>(n)) {
                try {
                    if (n.props.onCatch(err, node, isUpdating)) {
                        foundHandler = true;
                        break;
                    }
                } catch (err2) {
                    err = err2;
                }
            }
            n = n.parentComponent;
        }
        if (!foundHandler) {
        }
    } finally {
        currentComponent = undefined;
    }
    return newChildren;
}

function getParents(node: VNode | VNodeCreated) {
    let n = node.parentComponent;
    const parents: (VNode | VNodeCreated)[] = [];
    while (typeof n !== 'string') {
        parents.push(n);
        n = n.parentComponent;
    }
    return parents;
}

function restartComponent(node: VComponentNode): boolean {
    isUpdating = true;
    // (node as VNodeCreated).status === 'cancelled' ||
    if (node.status === 'removed' || node.status === 'obsolete' || (node as VNodeCreated).status === 'cancelled') return false;
    console.log('restart', node.type.name, node);
    assert(node.status === 'active');
    visitEachNode(node, n => assert(n.status === 'active'));
    const newChildren = runComponent(node as VComponentNodeCreated);
    const newChild = updateVNode(node, newChildren, node.children, node.id) as VComponentNode;
    updatedComponents.push({newChild, node});
    return true;
}

function setPromiseToParentSuspense(
    component: VComponentNodeCreated,
    suspense: VComponentType<typeof Suspense, SuspenseState>,
    promise: Promise<unknown>,
) {
    const state = suspense.state;
    assert(component.status === 'created');
    if (state.components.size === 0) {
        state.timeoutAt = now + suspense.props.timeout;
    }
    state.version++;
    state.components.set(component, promise);
    resolveSuspensePromises(state).then(() => {
        console.log('will restart suspense state, promises resolved', state);
        restartSuspense(state, suspense);
    });

    if (state.timeoutAt > now) {
        const parentSuspense = getParents(suspense).find(parent => parent.type === Suspense);
        const promise = Promise.race([Promise.all([...state.components.values()]), sleep(state.timeoutAt - now + 1)]);
        if (parentSuspense === undefined) {
            if (isUpdating) {
                rootSuspended = true;
                console.log('root suspended');
            }
            globalSuspense.version++;
            globalSuspense.components.set(suspense, promise);
            resolveSuspensePromises(globalSuspense).then(() => {
                console.log('will restart global suspense state, promises resolved', state);
                restartSuspense(globalSuspense, undefined);
            });
        } else {
            throw promise;
        }
    }
}

function restartSuspense(state: SuspenseState, suspense: VComponentType<typeof Suspense> | undefined) {
    transactionStart();
    let lastVersion = state.version;
    for (const [component] of state.components) {
        if (
            component.type === Suspense &&
            (component as VComponentType<typeof Suspense, SuspenseState>).state.components.size === 0
        ) {
            continue;
        }
        restartComponent(component as VComponentNode);
    }
    commitUpdating();
    transactionStart();
    if (state.version === lastVersion) {
        state.components.clear();
        if (suspense !== undefined) {
            console.log('will restart suspense component, promises resolved');
            restartComponent(suspense as VComponentNode);
        }
    }
    commitUpdating();
    console.log('restartSuspense done');
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

// function addErrorToParentBoundary(component: VComponentNodeCreated, error: Error) {
//     const errorBoundary = findErrorBoundary(component);
//     if (errorBoundary === undefined) {
//         setTimeout(() => {
//             const rootId = findRootId(component);
//             unmountComponentAtNode(rootId);
//         });
//         return;
//     }
//     if (errorBoundary.state.errors.length === 0) {
//         errorBoundary.state.errors.push(error);
//         assert(errorBoundary.status === 'active' || errorBoundary.status === 'created');
//         assert(component.status === 'created');
//         setTimeout(() => {
//             transactionStart();
//             restartComponent(errorBoundary as VComponentNode);
//             commitUpdating();
//         });
//     }
// }

// function findSuspenseShield(node: VNode | VNodeCreated) {
//     let n = node.parentComponent;
//     while (typeof n !== 'string') {
//         if (
//             n.type === Suspense &&
//             is<VSuspenseNodeCreated>(n) &&
//             (n.state.components.size === 0 || n.state.timeoutAt < now)
//         ) {
//             return n;
//         }
//         n = n.parentComponent;
//     }
// }
// function findSuspense(node: VNode | VNodeCreated) {
//     let n = node.parentComponent;
//     while (typeof n !== 'string') {
//         if (n.type === Suspense && is<VSuspenseNodeCreated>(n)) {
//             return n;
//         }
//         n = n.parentComponent;
//     }
// }

// function findErrorBoundary(node: VNode | VNodeCreated) {
//     let n = node.parentComponent;
//     while (typeof n !== 'string') {
//         if (n.type === ErrorBoundary) return n as VErrorBoundaryNodeCreated;
//         n = n.parentComponent;
//     }
// }

function findRootId(node: VNode | VNodeCreated): RootId {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        n = n.parentComponent;
    }
    return n;
}
