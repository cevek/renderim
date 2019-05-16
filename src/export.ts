function createElement(
    type: string | ((props: object) => VNode | undefined),
    props: object | null,
    ...children: Return[]
): VComponentNode | VDomNode {
    const key = props !== null ? (props as {key?: string}).key : undefined;
    if (typeof type === 'string') {
        const vdomNode: VDomNode = {
            id: genId(),
            children: children,
            key: key,
            kind: domKind,
            props: createPropsFromObj(props),
            type: type,
        };
        return vdomNode;
    } else {
        let componentProps;
        if (props === null) {
            componentProps = {children};
        } else {
            componentProps = props;
            (componentProps as {children: Return}).children = children;
        }
        const vComponentNode: VComponentNode = {
            id: undefined!,
            children: undefined!,
            key: key,
            kind: componentKind,
            props: componentProps,
            type: type,
        };
        return vComponentNode;
    }
}

function render(node: VComponentNode | VDomNode, htmlId: string) {
    const id = (htmlId as unknown) as ID;
    const oldNode = roots.get(id);
    if (oldNode !== undefined) {
        updateVNode(node, oldNode, id);
    } else {
        roots.set(id, node);
        createVNode(node, id, null);
    }
}

function unmount(htmlId: string) {
    const node = roots.get((htmlId as unknown) as ID);
    if (node !== undefined) {
        removeVNode(node);
    }
}

function getCommandList() {
    return commandList;
}
