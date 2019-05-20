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
    const rootSuspenseNode = createComponentVNode(Suspense, {
        fallback: 'Root Loading...',
        timeout: 0,
        children: node,
    });
    rootSuspenseNode.suspense = Object.freeze({}) as VSuspenseNode;
    const rootNode = createComponentVNode(ErrorBoundary, {
        children: rootSuspenseNode,
        fallback: (props: {errors: Error[]}) => {
            console.error(props.errors);
            return 'Something went wrong';
        },
    });
    rootNode.errorBoundary = Object.freeze({}) as VErrorBoundaryNode;
    rootNode.suspense = Object.freeze({}) as VSuspenseNode;

    const id = (htmlId as unknown) as ID;
    const oldNode = roots.get(id);
    assert(commandList.length === 0);
    roots.set(id, oldNode === undefined ? mountVNode(rootNode, id, null) : updateVNode(rootNode, oldNode, id));
    commitUpdating();
    validateStatusDeep(roots.get(id)!, 'active');
    if (oldNode !== undefined) {
        staleOldVNodeDeep(oldNode);
    }
}

function unmount(htmlId: string) {
    const node = roots.get((htmlId as unknown) as ID);
    if (node !== undefined) {
        removeVNode(node, true);
    }
}
