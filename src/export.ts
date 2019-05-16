function createElement(
    type: string | ((props: object) => VNode | undefined),
    props: object | undefined | null,
    ...children: Return[]
): VComponentNode | VDomNode {
    if (typeof type === 'string') {
        const vdomNode: VDomNode = {
            id: genId(),
            children: children,
            key: undefined,
            kind: domKind,
            props: createPropsFromObj(props),
            type: type,
        };
        return vdomNode;
    } else {
        const vComponentNode: VComponentNode = {
            id: undefined!,
            children: undefined!,
            key: undefined,
            kind: componentKind,
            props: props === undefined || props === null ? defaultProps : props,
            type: type,
        };
        return vComponentNode;
    }
}

function render(node: VComponentNode | VDomNode, htmlId: ID) {
    const oldNode = roots.get(htmlId);
    if (oldNode !== undefined) {
        updateVNode(node, oldNode, htmlId);
    } else {
        createVNode(node, htmlId, null);
    }
}

function unmount(htmlId: ID) {
    const node = roots.get(htmlId);
    if (node !== undefined) {
        removeVNode(node);
    }
}
