function mountVNode(parentNode: ParentComponent, node: VNodeCreated, parentId: ID, beforeId: ID | null): VNode {
    if (node.status === 'active') {
        node = cloneVNode(node);
    }
    assert(node.status === 'created');
    node.parentComponent = parentNode;
    if (node.kind === componentKind) {
        node = mountComponent(node, parentId, beforeId);
    } else if (node.kind === domKind) {
        node = mountVDom(node, parentId, beforeId);
    } else if (node.kind === textKind) {
        addCommand(node, {
            action: 'create',
            group: 'text',
            rootId: findRootId(node),
            parentId,
            beforeId,
            id: node.id,
            text: node.children,
        });
    } else if (node.kind === arrayKind) {
        mountChildren(node, parentId, beforeId);
    } else if (node.kind === portalKind) {
        node.children = mountVNode(node, norm(node.children), node.type, null);
    } else {
        throw never(node);
    }
    node.status = 'active';
    maybeCancelled.push(node);
    return node as VNode;
}

function mountComponent(node: VComponentNodeCreated, parentId: ID, beforeId: ID | null): VComponentNodeCreated {
    node.id = parentId;
    runComponent(node);
    if (node.type === ErrorBoundary) {
        node = handleErrorBoundary(node as VErrorBoundaryNodeCreated, undefined, parentId, beforeId);
    } else if (node.type === Suspense) {
        node = handleSuspense(node as VSuspenseNodeCreated, undefined, parentId, beforeId);
    } else {
        node.children = mountVNode(node, norm(node.children), parentId, beforeId);
    }
    return node;
}

function mountVDom(node: VDomNodeCreated, parentId: ID, beforeId: ID | null) {
    const props = node.props as JSX.IntrinsicElements[string];
    addCommand(node, {
        action: 'create',
        group: 'tag',
        parentId,
        beforeId,
        rootId: findRootId(node),
        id: node.id,
        attrs: transformAttrCallbacks(node.props),
        tag: node.type,
    });
    mountChildren(node, node.id, null);
    if (node.type === 'select') {
        updateSelectValue(node);
    }
    if (props.customChild !== undefined) {
        addCommand(node, {
            action: 'create',
            group: 'custom',
            parentId: node.id,
            data: props.customChild.data,
            name: props.customChild.name,
            url: customUrl(props.customChild),
        });
    }
    return node;
}

function mountChildren(node: VChildrenNodeCreated, parentId: ID, beforeId: ID | null) {
    for (let i = 0; i < node.children.length; i++) {
        node.children[i] = mountVNode(node, norm(node.children[i]), parentId, beforeId);
    }
}
