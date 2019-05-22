function getCurrentComponentNode() {
    if (currentComponent === undefined) throw new Error('No current component');
    return currentComponent;
}

function runComponent(node: VComponentNode) {
    assert(node.status === 'created');
    const prev = currentComponent;
    currentComponent = node;

    try {
        node.children = norm(node.type(node.props));
    } catch (err) {
        node.children = norm(undefined);
        if (err instanceof Promise) {
            addPromiseToParentSuspense(node, err);
        } else if (err instanceof AssertError) {
            throw err;
        } else {
            new Promise(() => {
                node.type(node.props);
            });
            node.errorBoundary.extra.errors.push(err);
        }
    }
    currentComponent = prev;
}

function Fragment(props: {children: Return}) {
    return props.children as VComponentNode;
}

type ErrorBoundaryProps = {children: Return; fallback: (props: {errors: Error[]}) => Return};
type ErrorBoundaryExtra = {errors: Error[]};
type VErrorBoundaryNode = VComponentNode & {props: ErrorBoundaryProps; extra: ErrorBoundaryExtra};
function ErrorBoundary(props: ErrorBoundaryProps) {
    return props.children as VComponentNode;
}

type SuspenseExtra = {
    timeoutAt: number;
    promises: Promise<unknown>[];
    resolvedPromises: number;
    components: VComponentNode[];
};
type SuspenseProps = {children: Return; timeout: number; fallback: Return};
type VSuspenseNode = VComponentNode & {props: SuspenseProps; extra: SuspenseExtra};
function Suspense(props: SuspenseProps) {
    return props.children as VComponentNode;
}

function restartComponent(node: VComponentNode) {
    if (node.status === 'removed' || node.status === 'cancelled') return;
    console.log('restart', node);
    assert(node.status === 'active');
    visitEachNode(node, n => assert(n.status === 'active'));

    const prevErrorBoundary = currentErrorBoundary;
    const prevSuspense = currentSuspense;

    assert(node.errorBoundary !== undefined);
    assert(node.suspense !== undefined);

    currentErrorBoundary = node.errorBoundary;
    currentSuspense = node.suspense;
    const newNode = updateVNode(createComponentVNode(node.type, node.props, node.key), node, node.id) as VComponentNode;
    assert(newNode.kind === componentKind);
    maybeRestarted.push({newNode: newNode, oldNode: node});

    currentErrorBoundary = prevErrorBoundary;
    currentSuspense = prevSuspense;
}

function handleErrorBoundary(node: VErrorBoundaryNode,  oldChild: VNode | undefined, parentId: ID, beforeId: ID | null) {
    assert(node.status === 'created');
    if (node.extra.errors.length === 0) {
        const prevErrorBoundary = currentErrorBoundary;
        currentErrorBoundary = node;
        node.children = mountOrUpdate(node.children, oldChild, parentId, beforeId);
        currentErrorBoundary = prevErrorBoundary;
    }
    if (node.extra.errors.length > 0) {
        // removeInsideSuspenseOrBoundary(node.children);
        // node.children = handleChild(createComponentVNode(node.props.fallback, {errors: node.extra.errors}));
    }
    return node;
}

function handleSuspense(node: VSuspenseNode, oldChild: VNode | undefined, parentId: ID, beforeId: ID | null) {
    assert(node.status === 'created');
    assert(node.extra.components.length === node.extra.promises.length);
    const parentSuspense = currentSuspense;
    currentSuspense = node;
    if (node.extra.promises.length > 0) {
        for (const component of node.extra.components) {
            restartComponent(component);
        }
        if (node.extra.resolvedPromises === node.extra.promises.length) {
            node.extra.promises = [];
            node.extra.components = [];
            node.extra.resolvedPromises = 0;
        }
    }
    node.children = mountOrUpdate(node.children, oldChild, parentId, beforeId);
    currentSuspense = parentSuspense;
    if (node.extra.promises.length > 0) {
        if (node.extra.timeoutAt <= Date.now()) {
            // removeInsideSuspenseOrBoundary(node.children);
            // node.children = mountOrUpdate(norm(node.props.fallback), oldChild, parentId, beforeId);
            if (oldChild !== undefined) {
                node.children = oldChild;
            }
        } else {
            addPromiseToParentSuspense(
                node,
                Promise.race([Promise.all(node.extra.promises), sleep(node.extra.timeoutAt - Date.now() + 1)]),
            );
            // node.extra.promises = [];
            // node.extra.components = [];
        }
    }
    return node;
}

function removeInsideSuspenseOrBoundary(node: VNode) {
    removeVNode(node, true);
    visitEachNode(node, n => {
        // if (node.status === '')
        // node.status = 'cancelled';
        n.errorBoundary = rootErrorBoundary;
        n.suspense = rootSuspense;
    });
}

function addPromiseToParentSuspense(component: VComponentNode, promise: Promise<unknown>) {
    const suspense = component.suspense;
    assert(suspense.status === 'active' || suspense.status === 'created');
    assert(component.status === 'created');
    if (suspense.extra.promises.length === 0) {
        suspense.extra.timeoutAt = Date.now() + suspense.props.timeout;
    }
    suspense.extra.promises.push(promise.catch(noop));
    suspense.extra.components.push(component);
    const currentPromises = suspense.extra.promises;
    console.log('add promise to suspense', suspense);
    debugger;
    // visitEachNode(suspense, n => console.log(n.status));
    Promise.all(currentPromises).then(() => {
        // todo: check actual id
        suspense.extra.resolvedPromises = currentPromises.length;
        restartComponent(suspense);
        commitUpdating();
        // if (currentPromises.length === suspense.extra.promises.length) {
        //     suspense.extra.promises = [];
        //     suspense.extra.components = [];
        // }
    });
}
