function getCurrentComponentNode() {
    if (currentComponent === undefined) throw new Error('No current component');
    return currentComponent;
}

function runComponent(node: VComponentNode) {
    const prev = currentComponent;
    currentComponent = node;
    try {
        node.children = norm(node.type(node.props));
    } catch (err) {
        node.children = norm(undefined);
        if (err instanceof Promise) {
            suspensePromises.push(err);
        } else {
            new Promise(() => {
                node.type(node.props);
            });
            throw err;
        }
    } finally {
        currentComponent = prev;
    }
}



function Fragment(props: {children: Return}) {
    return props.children as VComponentNode;
}

type ErrorBoundaryProps = {children: Return; fallback: (props: {error: Error}) => Return};
function ErrorBoundary(props: ErrorBoundaryProps) {
    return props.children as VComponentNode;
}

type SuspenseExtra = {timeoutAt: number};
type SuspenseProps = {children: Return; timeout: number; fallback: Return};
function Suspense(props: SuspenseProps) {
    return props.children as VComponentNode;
}

function handleSuspense(node: VSuspenseNode, handleChild: (child: VNode) => VNode) {
    const parentPromises = suspensePromises;
    suspensePromises = [];
    if (node.extra === undefined) {
        node.extra = {timeoutAt: Date.now() + node.props.timeout};
    }
    try {
        const commandListEnd = commandList.length;
        node.children = handleChild(node.children);
        if (suspensePromises.length > 0) {
            clearArrayUntil(commandList, commandListEnd);
            const restart = restartComponent.bind(undefined, node);
            if (node.extra.timeoutAt <= Date.now()) {
                // can throws
                node.children = handleChild(norm(node.props.fallback));
                Promise.all(suspensePromises).then(restart, restart);
            } else {
                parentPromises.push(
                    Promise.race([Promise.all(suspensePromises), sleep(node.extra.timeoutAt - Date.now() + 1)]),
                );
            }
        }
    } finally {
        suspensePromises = parentPromises;
    }
    return node;
}

function handleErrorBoundary(node: VErrorBoundaryNode, handleChild: (child: VNode) => VNode) {
    const commandListEnd = commandList.length;
    const suspensePromisesEnd = suspensePromises.length;
    try {
        node.children = handleChild(node.children);
    } catch (err) {
        clearArrayUntil(commandList, commandListEnd);
        clearArrayUntil(suspensePromises, suspensePromisesEnd);
        node.children = handleChild(createComponentVNode(node.props.fallback, {error: err}));
    }
    return node;
}
