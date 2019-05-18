function createElement(type: string | ComponentFun, props: object | null, ...children: Return[]): VElement {
    const key = props === null ? undefined : (props as {key?: string}).key;
    if (typeof type === 'string') {
        return createDomVNode(type, props, key, children);
    } else if (typeof type === 'function') {
        if (props === null) props = {children};
        else (props as {children?: Return}).children = children;
        return createComponentVNode(type, props, key);
    } else {
        throw new Error('Component type is empty: ' + type);
    }
}

function render(node: VNode, htmlId: string) {
    const rootNode = createComponentVNode(ErrorBoundary, {
        children: createComponentVNode(Suspense, {
            fallback: undefined,
            timeout: 0,
            children: node,
        }),
        fallback: (props: {error: Error}) => {
            console.error(props.error);
            return undefined;
        },
    });
    const id = (htmlId as unknown) as ID;
    const oldNode = roots.get(id);
    assert(commandList.length === 0);
    assert(suspensePromises.length === 0);
    roots.set(id, oldNode === undefined ? mountVNode(rootNode, id, null) : updateVNode(rootNode, oldNode, id));
    renderCommands(commandList);
    clearArrayUntil(commandList, 0);
}

function restartComponent(node: VComponentNode) {
    assert(commandList.length === 0);
    assert(suspensePromises.length === 0);
    updateComponent(node, node, node.id);
    renderCommands(commandList);
    clearArrayUntil(commandList, 0);
}

function unmount(htmlId: string) {
    const node = roots.get((htmlId as unknown) as ID);
    if (node !== undefined) {
        removeVNode(node, true);
    }
}

function getCommandList() {
    return commandList;
}
