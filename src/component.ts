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
        if (err instanceof Promise) {
            suspensePromises.push(err);
        } else {
            new Promise(() => {
                node.children = norm(node.type(node.props));
            });
            throw err;
        }
    } finally {
        currentComponent = prev;
    }
}

function restartComponent(node: VComponentNode) {
    const oldChildren = node.children;
    runComponent(node);
    updateVNode(node.children, oldChildren, node.id);
}

function createFallback(node: VComponentNode, error: Error) {
    return createComponentVNode((node.props as ErrorBoundaryProps).fallback as ComponentFun, {error}, node.key, []);
}

function catchComponentError(
    node: VComponentNode,
    error: Error,
    commandListEnd: number,
    parentComponent: VComponentNode,
) {
    while (commandList.length > commandListEnd) commandList.pop();
    if (node.type === ErrorBoundary) {
        currentComponent = createComponentVNode(
            (node.props as ErrorBoundaryProps).fallback as ComponentFun,
            {error},
            undefined,
            [],
        );
        node.children = norm(currentComponent.type(currentComponent.props));
    }
    currentComponent = parentComponent;
}

function Fragment(props: {children: Return}) {
    return props.children as VComponentNode;
}

type ErrorBoundaryProps = {children: Return; fallback: (props: {error: Error}) => Return};
function ErrorBoundary(props: ErrorBoundaryProps) {
    return props.children as VComponentNode;
}

function Suspense(props: {children: Return; fallback: Return}) {
    return props.children as VComponentNode;
}
