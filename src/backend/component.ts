function runComponent(node: VComponentNodeCreated) {
    assert(node.status === 'created' || node.status === 'active');
    GLOBAL_CURRENT_COMPONENT = node.instance;
    node.instance.trxId = GLOBAL_TRX_ID;
    let newChildren;
    try {
        const prevErrored = node.instance.errored;
        node.instance.errored = false;
        GLOBAL_HOOKS.beforeComponent(node);
        newChildren = norm(node.type(node.props));
        GLOBAL_HOOKS.afterComponent(node);
        if (prevErrored) {
            processBoundarySubcomponentErrorGone(node);
        }
    } catch (err) {
        GLOBAL_HOOKS.afterComponent(node);
        newChildren = norm(undefined);
        node.instance.errored = true;
        if (err === CancellationToken) {
            cancelUpdating();
        } else {
            processBoundarySubcomponentError(node, err);
        }
    } finally {
        GLOBAL_CURRENT_COMPONENT = undefined;
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

function restartComponent(instance: ComponentInstance): boolean {
    const node = instance.node;
    if (
        instance.trxId === GLOBAL_TRX_ID ||
        node.status === 'removed' ||
        node.status === 'obsolete' ||
        node.status === 'cancelled'
    ) {
        return false;
    }
    // console.log('restart', node.type.name, node);
    assert(node.status === 'active');
    visitEachNode(node, n => assert(n.status === 'active'));
    const newChildren = runComponent(node);
    const newChild = updateVNode(node, newChildren, node.children, node.id) as VComponentNode;
    GLOBAL_TASKS.push({kind: 'restart', node, newChild});
    GLOBAL_TASKS.push({kind: 'updateComponent', node});
    return true;
}

function setPromiseToParentSuspense(
    component: ComponentInstance,
    suspenseInstance: ComponentInstance<SuspenseState>,
    timeout: number,
    promise: Promise<unknown>,
) {
    const suspense = suspenseInstance.state;
    if (suspense.components.size === 0) {
        suspense.timeoutAt = GLOBAL_NOW + timeout;
    }
    suspense.version++;
    suspense.components.set(component, promise);
    const version = suspense.version;
    resolveSuspensePromises(suspense).then(() => {
        restartSuspense(suspenseInstance, version);
    });

    if (suspense.timeoutAt > GLOBAL_NOW) {
        const parentSuspense = getParents(suspenseInstance.node).find(parent => parent.type === Suspense);
        const sleepPromise = sleep(suspense.timeoutAt - GLOBAL_NOW + 1);
        if (parentSuspense === undefined) {
            sleepPromise.then(() => {
                if (suspense.version === version && suspense.components.size > 0) {
                    transactionStart();
                    restartComponent(suspenseInstance);
                    commitUpdating();
                }
            });
            cancelUpdating();
        } else {
            throw Promise.race([Promise.all([...suspense.components.values()]), sleepPromise]);
        }
    }
}

function restartSuspense(instance: ComponentInstance<SuspenseState>, version: number) {
    const state = instance.state;
    if (state.components.size === 0 || version !== state.version) return;
    transactionStart();
    let lastVersion = state.version;
    // const components = [...state.components];
    for (const [component] of state.components) {
        if (component.node.type === Suspense && (component.state as SuspenseState).components.size === 0) {
            continue;
        }
        restartComponent(component);
    }
    commitUpdating();
    if (state.version === lastVersion) {
        state.components.clear();
        transactionStart();
        restartComponent(instance);
        commitUpdating();
        // console.log('restartSuspense done');
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
