function runComponent(node: VComponentNode) {
    assert(node.status === 'created');
    try {
        (node as NoReadonly<VComponentNode>).children = norm(node.type(node.props));
    } catch (err) {
        (node as NoReadonly<VComponentNode>).children = norm(undefined);
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

function restartComponent(node: VComponentNode): boolean {
    if (node.status === 'removed' || node.status === 'cancelled' || node.status === 'obsolete') return false;
    console.log('restart', node);
    assert(node.status === 'active');
    visitEachNode(node, n => assert(n.status === 'active'));

    const prevCurrentComponent = currentComponent;
    currentComponent = nonNull(node.parentComponent);

    const newNode = updateVNode(createComponentVNode(node.type, node.props, node.key), node, node.id) as VComponentNode;
    assert(newNode.kind === componentKind);
    maybeRestarted.push({newNode: newNode, oldNode: node});

    currentComponent = prevCurrentComponent;
    return true;
}

function handleErrorBoundary(node: VErrorBoundaryNode, oldChild: VNode | undefined, parentId: ID, beforeId: ID | null) {
    assert(node.status === 'created');
    if (node.extra.errors.length > 0) {
        currentComponent = nonNull(node.parentComponent);
        (node as NoReadonly<VErrorBoundaryNode>).children = mountOrUpdate(
            createComponentVNode(node.props.fallback, {errors: node.extra.errors}),
            oldChild,
            parentId,
            beforeId,
        );
        currentComponent = node;
    }
    if (node.extra.errors.length === 0) {
        (node as NoReadonly<VErrorBoundaryNode>).children = mountOrUpdate(node.children, oldChild, parentId, beforeId);
    }
    return node;
}

function handleSuspense(node: VSuspenseNode, oldChild: VNode | undefined, parentId: ID, beforeId: ID | null) {
    assert(node.status === 'created');
    assert(node.extra.components.length === node.extra.promises.length);
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
    (node as NoReadonly<VSuspenseNode>).children = mountOrUpdate(node.children, oldChild, parentId, beforeId);
    if (node.extra.promises.length > 0) {
        if (node.extra.timeoutAt <= Date.now()) {
            if (oldChild !== undefined) {
                (node as NoReadonly<VSuspenseNode>).children = oldChild;
            }
        } else {
            addPromiseToParentSuspense(
                node,
                Promise.race([Promise.all(node.extra.promises), sleep(node.extra.timeoutAt - Date.now() + 1)]),
            );
        }
    }
    return node;
}

function addPromiseToParentSuspense(component: VComponentNode, promise: Promise<unknown>) {
    const suspense = findSuspense(component);
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
        const restarted = restartComponent(suspense);
        if (restarted) {
            commitUpdating();
        }
    });
}

function addErrorToParentBoundary(component: VComponentNode, error: Error) {
    const errorBoundary = findErrorBoundary(component);
    errorBoundary.extra.errors.push(error);
    assert(errorBoundary.status === 'active' || errorBoundary.status === 'created');
    assert(component.status === 'created');
    Promise.resolve().then(() => {
        const restarted = restartComponent(errorBoundary);
        if (restarted) {
            commitUpdating();
        }
    });
}

function findSuspense(node: VNode) {
    let n = node.parentComponent;
    while (n !== undefined) {
        if (n.type === Suspense) return n as VSuspenseNode;
        n = n.parentComponent;
    }
    return never();
}

function findErrorBoundary(node: VNode) {
    let n = node.parentComponent;
    while (n !== undefined) {
        if (n.type === ErrorBoundary) return n as VErrorBoundaryNode;
        n = n.parentComponent;
    }
    return never();
}
