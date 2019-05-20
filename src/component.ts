function getCurrentComponentNode() {
    if (currentComponent === undefined) throw new Error('No current component');
    return currentComponent;
}

function runComponent(node: VComponentNode) {
    assert(node.status === 'created');
    const prev = currentComponent;
    currentComponent = node;
    node.suspense = currentSuspense;
    node.errorBoundary = currentErrorBoundary;

    const commandListEnd = commandList.length;
    try {
        node.children = norm(node.type(node.props));
    } catch (err) {
        node.children = norm(undefined);
        if (err instanceof Promise) {
            addPromiseToParentSuspense(node, err);
        } else {
            new Promise(() => {
                node.type(node.props);
            });
            node.errorBoundary.extra.errors.push(err);
            skipAndClearCommands(node.errorBoundary.extra.commands);
        }
    }
    for (let i = commandListEnd; i < commandList.length; i++) {
        const command = commandList[i];
        if (node.suspense.extra.promises.length === 0) {
            node.suspense.extra.commands.push(command);
        }
        if (node.errorBoundary.extra.errors.length === 0) {
            node.errorBoundary.extra.commands.push(command);
        }
    }
    currentComponent = prev;
}

function Fragment(props: {children: Return}) {
    return props.children as VComponentNode;
}

type ErrorBoundaryProps = {children: Return; fallback: (props: {errors: Error[]}) => Return};
type ErrorBoundaryExtra = {commands: Command[]; errors: Error[]};
type VErrorBoundaryNode = VComponentNode & {props: ErrorBoundaryProps; extra: ErrorBoundaryExtra};
function ErrorBoundary(props: ErrorBoundaryProps) {
    return props.children as VComponentNode;
}

type SuspenseExtra = {
    timeoutAt: number;
    commands: Command[];
    promises: Promise<unknown>[];
    components: VComponentNode[];
};
type SuspenseProps = {children: Return; timeout: number; fallback: Return};
type VSuspenseNode = VComponentNode & {props: SuspenseProps; extra: SuspenseExtra};
function Suspense(props: SuspenseProps) {
    return props.children as VComponentNode;
}

function restartComponent(node: VComponentNode) {
    if (node.status === 'removed') return;
    assert(node.status === 'active');

    const prevErrorBoundary = currentErrorBoundary;
    const prevSuspense = currentSuspense;

    currentErrorBoundary = node.errorBoundary;
    currentSuspense = node.suspense;
    const newNode = updateComponent(createComponentVNode(node.type, node.props, node.key), node, node.id, true);
    restartedComponents.push({new: newNode, old: node});

    currentErrorBoundary = prevErrorBoundary;
    currentSuspense = prevSuspense;
}

function commitUpdating() {
    for (const cmp of restartedComponents) {
        if (cmp.old.suspense.extra.promises.length === 0) {
            staleOldVNodeDeep(cmp.old.children);
            cmp.old.children = cmp.new.children;
            cmp.old.status = cmp.new.status;
            //todo: suspense?, errorBoundary?
        }
    }
    restartedComponents = [];
    renderCommands(commandList.filter(command => command.skip === undefined));
    clearArrayUntil(commandList, 0);

    assert(currentSuspense === rootSuspense);
    assert(currentErrorBoundary === rootErrorBoundary);
}

function handleErrorBoundary(node: VErrorBoundaryNode, handleChild: (child: VNode) => VNode) {
    assert(node.status === 'created');
    if (node.extra.errors.length === 0) {
        const prevErrorBoundary = currentErrorBoundary;
        currentErrorBoundary = node;
        node.children = handleChild(node.children);
        currentErrorBoundary = prevErrorBoundary;
    }
    if (node.extra.errors.length > 0) {
        node.children = handleChild(createComponentVNode(node.props.fallback, {errors: node.extra.errors}));
    }
    node.status = 'active';
    return node;
}

function handleSuspense(
    node: VSuspenseNode,
    fromRestart: boolean,
    oldChild: VNode | undefined,
    parentId: ID,
    beforeId: ID | null,
) {
    assert(node.status === 'created');
    assert(node.extra.components.length === node.extra.promises.length);
    const parentSuspense = currentSuspense;
    currentSuspense = node;
    node.children = mountOrUpdate(node.children, oldChild, parentId, beforeId);

    if (fromRestart) {
        const prevPromisesCount = node.extra.promises.length;
        for (const component of node.extra.components) {
            restartComponent(component);
        }
        if (prevPromisesCount === node.extra.promises.length) {
            node.extra.promises = [];
            node.extra.components = [];
        }
    }
    if (node.extra.promises.length > 0) {
        skipAndClearCommands(node.extra.commands);
        if (node.extra.timeoutAt <= Date.now()) {
            node.children = mountOrUpdate(norm(node.props.fallback), oldChild, parentId, beforeId);
        } else {
            addPromiseToParentSuspense(
                node,
                Promise.race([Promise.all(node.extra.promises), sleep(node.extra.timeoutAt - Date.now() + 1)]),
            );
        }
    }
    currentSuspense = parentSuspense;
    node.status = 'active';
    return node;
}

function addPromiseToParentSuspense(component: VComponentNode, promise: Promise<unknown>) {
    const suspense = component.suspense;
    assert(suspense.status === 'active' || suspense.status === 'created');
    assert(component.status === 'created');
    skipAndClearCommands(suspense.extra.commands);
    if (suspense.extra.promises.length === 0) {
        suspense.extra.timeoutAt = Date.now() + suspense.props.timeout;
    }
    suspense.extra.promises.push(promise.catch(noop));
    suspense.extra.components.push(component);
    const currentPromises = suspense.extra.promises;
    Promise.all(currentPromises).then(() => {
        // todo: check actual id
        console.log(123123);
        restartComponent(suspense);
        commitUpdating();
        if (currentPromises.length === suspense.extra.promises.length) {
            suspense.extra.promises = [];
        }
    });
}
