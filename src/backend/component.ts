function runComponent(node: VComponentNodeCreated) {
    assert(node.status === 'created' || node.status === 'active');
    currentComponent = node;
    let newChildren;
    try {
        const prevErrored = node.state.errored;
        node.state.errored = false;
        hooks.beforeComponent(node);
        newChildren = norm(node.type(node.props));
        hooks.afterComponent(node);
        if (prevErrored) {
            processBoundarySubcomponentErrorGone(node);
        }
    } catch (err) {
        hooks.afterComponent(node);
        newChildren = norm(undefined);
        node.state.errored = true;
        if (err === CancellationToken) {
            cancelUpdating();
        } else {
            processBoundarySubcomponentError(node, err);
        }
    } finally {
        currentComponent = undefined;
    }
    return newChildren;
}

function getParents(node: VNodeCreated) {
    let n = node.parentComponent;
    const parents: VNodeCreated[] = [];
    while (typeof n !== 'string') {
        parents.push(n);
        n = n.parentComponent;
    }
    return parents;
}

function restartComponent(state: ComponentState): boolean {
    const node = state.node;
    if (node.status === 'removed' || node.status === 'obsolete' || node.status === 'cancelled') return false;
    console.log('restart', node.type.name, node);
    assert(node.status === 'active');
    visitEachNode(node, n => assert(n.status === 'active'));
    const newChildren = runComponent(node);
    const newChild = updateVNode(node, newChildren, node.children, node.id) as VComponentNode;
    updatedComponents.push({newChild, node, isRestart: true});
    return true;
}

function setPromiseToParentSuspense(
    componentState: ComponentState,
    suspense: VComponentType<typeof Suspense, SuspenseState>,
    promise: Promise<unknown>,
) {
    const state = suspense.state;
    if (state.components.size === 0) {
        state.timeoutAt = now + suspense.props.timeout;
    }
    state.version++;
    state.components.set(componentState, promise);
    const version = state.version;
    resolveSuspensePromises(state).then(() => {
        console.log('will restart suspense state, promises resolved', state);
        restartSuspense(state, version);
    });

    if (state.timeoutAt > now) {
        const parentSuspense = getParents(suspense).find(parent => parent.type === Suspense);
        const sleepPromise = sleep(state.timeoutAt - now + 1);
        if (parentSuspense === undefined) {
            sleepPromise.then(() => {
                if (state.version === version && state.components.size > 0) {
                    transactionStart();
                    restartComponent(state);
                    commitUpdating();
                }
            });
            cancelUpdating();
        } else {
            throw Promise.race([Promise.all([...state.components.values()]), sleepPromise]);
        }
    }
}

function restartSuspense(state: SuspenseState, version: number) {
    if (state.components.size === 0 || version !== state.version) return;
    transactionStart();
    let lastVersion = state.version;
    for (const [componentState] of state.components) {
        if (componentState.node.type === Suspense && (componentState as SuspenseState).components.size === 0) {
            continue;
        }
        restartComponent(componentState);
    }
    commitUpdating();
    if (state.version === lastVersion) {
        state.components.clear();
        transactionStart();
        restartComponent(state);
        commitUpdating();
        console.log('restartSuspense done');
    }
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

function findRootId(node: VNodeCreated): RootId {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        n = n.parentComponent;
    }
    return n;
}

function processBoundarySubcomponentRemoved(node: VComponentNodeCreated) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === Boundary && n.status !== 'removed' && is<VComponentType<typeof Boundary>>(n)) {
            try {
                if (typeof n.props.onSubcomponentRemoved === 'function' && n.props.onSubcomponentRemoved(node)) {
                    break;
                }
            } catch (err) {
                console.error(err);
            }
        }
        n = n.parentComponent;
    }
}
function processBoundarySubcomponentErrorGone(node: VComponentNodeCreated) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === Boundary && is<VComponentType<typeof Boundary>>(n)) {
            try {
                if (typeof n.props.onSubcomponentErrorGone === 'function' && n.props.onSubcomponentErrorGone(node)) {
                    break;
                }
            } catch (err) {
                console.error(err);
            }
        }
        n = n.parentComponent;
    }
}
function processBoundarySubcomponentError(node: VComponentNodeCreated, err: Error) {
    let foundHandler = false;
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === Boundary && is<VComponentType<typeof Boundary>>(n)) {
            try {
                if (n.props.onCatch(err, node)) {
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
        console.error(err);
        scheduleUpdate(() => unmount(findRootId(node)));
    }
}
