function runComponent(node: VComponentNodeCreated) {
    assert(node.status === 'created');
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
            addErrorToParentBoundary(node, err);
        }
    }
}

function Fragment(props: {children: VInput}) {
    return props.children;
}
function Portal(props: {container: string; children: VInput}) {
    return createVPortalNode((props.container as unknown) as ID, norm(props.children));
}

type ErrorBoundaryProps = {children: VInput; fallback: (props: {errors: Error[]}) => VInput};
type ErrorBoundaryExtra = {errors: Error[]};
type VErrorBoundaryNodeCreated = VComponentNodeCreated & {props: ErrorBoundaryProps; extra: ErrorBoundaryExtra};
function ErrorBoundary(props: ErrorBoundaryProps) {
    return props.children;
}

type SuspenseExtra = {
    timeoutAt: number;
    promises: Promise<unknown>[];
    resolvedPromises: number;
    components: VComponentNodeCreated[];
};
type SuspenseProps = {children: VInput; timeout: number; fallback: VInput};
type VSuspenseNodeCreated = VComponentNodeCreated & {props: SuspenseProps; extra: SuspenseExtra};
function Suspense(props: SuspenseProps) {
    return props.children;
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
    if (node.extra.errors.length > 0) {
        assert(typeof node.parentComponent !== 'string');
        currentComponent = node.parentComponent as VComponentNode;
        node.children = mountOrUpdate(
            createComponentVNode(node.props.fallback, {errors: node.extra.errors}),
            oldChild,
            parentId,
            beforeId,
        );
        currentComponent = node;
    }
    if (node.extra.errors.length === 0) {
        node.children = mountOrUpdate(norm(node.children), oldChild, parentId, beforeId);
    }
    return node;
}

function handleSuspense(node: VSuspenseNodeCreated, oldChild: VNode | undefined, parentId: ID, beforeId: ID | null) {
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
    node.children = mountOrUpdate(norm(node.children), oldChild, parentId, beforeId);
    if (node.extra.promises.length > 0) {
        if (node.extra.timeoutAt <= Date.now()) {
            if (oldChild !== undefined) {
                node.children = oldChild;
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

function addPromiseToParentSuspense(component: VComponentNodeCreated, promise: Promise<unknown>) {
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
    // debugger;
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

function addErrorToParentBoundary(component: VComponentNodeCreated, error: Error) {
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

function findSuspense(node: VNode | VNodeCreated) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === Suspense) return n as VSuspenseNodeCreated;
        n = n.parentComponent;
    }
    return never();
}

function findErrorBoundary(node: VNode | VNodeCreated) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        if (n.type === ErrorBoundary) return n as VErrorBoundaryNodeCreated;
        n = n.parentComponent;
    }
    return never();
}

function findRootId(node: VNodeCreated) {
    let n = node.parentComponent;
    while (typeof n !== 'string') {
        n = n.parentComponent;
    }
    return n;
}

function lazy<P, T extends (props: P) => VInput>(cmp: () => Promise<{default: T}>) {
    let component: T;
    let error: Error | undefined;
    const promise = cmp().then(m => (component = m.default), e => (error = e));
    return function Lazy(props: P) {
        if (error !== undefined) throw error;
        if (component === undefined) throw promise;
        return createElement((component as unknown) as ComponentFun, props as {});
    };
}

function IntersectionObserverContainer({
    children,
    rootMargin,
    threshold,
}: {
    children: VDomNodeCreated;
    rootMargin?: string;
    threshold?: string | number;
}) {
    const child = ensureVDomNode(children);
    const customChild: JSX.CustomChild = {
        name: 'IntersectionObserverContainer',
        data: {rootMargin, threshold},
    };
    (child as NoReadonly<VDomNodeCreated>).props = {...child.props, customChild};
    return child;
}

function IntersectionObserverElement<T extends DeepPartial<IntersectionObserverElementCallbackParams>>({
    children,
    onVisible,
    onVisibleParams,
    onInvisible,
}: {children: VDomNodeCreated} & IntersectionObserverElementProps<T>) {
    const child = ensureVDomNode(children);
    const customChild: JSX.CustomChild = {
        name: 'IntersectionObserverElement',
        data: {
            onVisible: transformCallback(
                setDataToCallback(onVisible, [onVisibleParams === undefined ? ({} as T) : onVisibleParams]),
            ),
            onInvisible: onInvisible === undefined ? undefined : transformCallback(onInvisible),
        },
    };
    (child as NoReadonly<VDomNodeCreated>).props = {...child.props, customChild};
    return child;
}
