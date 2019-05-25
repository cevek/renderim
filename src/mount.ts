function mountVNode(node: VNodeCreated, parentId: ID, beforeId: ID | null): VNode {
    if (node.status === 'active') {
        node = cloneVNode(node);
    }
    assert(node.status === 'created');
    node.parentComponent = currentComponent;
    if (node.kind === componentKind) {
        node = mountComponent(node, parentId, beforeId);
    } else if (node.kind === domKind) {
        node = mountVDom(node, parentId, beforeId);
    } else if (node.kind === textKind) {
        addCommand(node, {
            type: 'createText',
            rootId: findRootId(node),
            parentId,
            beforeId,
            id: node.id,
            text: node.children,
        });
    } else if (node.kind === arrayKind) {
        mountChildren(node, parentId, beforeId);
    } else if (node.kind === portalKind) {
        node.children = mountVNode(norm(node.children), node.type, null);
    } else {
        throw never(node);
    }
    node.status = 'active';
    maybeCancelled.push(node);
    return node as VNode;
}

function mountComponent(node: VComponentNodeCreated, parentId: ID, beforeId: ID | null): VComponentNodeCreated {
    const parentComponent = currentComponent;
    currentComponent = node;
    node.id = parentId;
    runComponent(node);
    if (node.type === ErrorBoundary) {
        node = handleErrorBoundary(node as VErrorBoundaryNodeCreated, undefined, parentId, beforeId);
    } else if (node.type === Suspense) {
        node = handleSuspense(node as VSuspenseNodeCreated, undefined, parentId, beforeId);
    } else {
        node.children = mountVNode(norm(node.children), parentId, beforeId);
    }
    currentComponent = parentComponent;
    return node;
}

function mountVDom(node: VDomNodeCreated, parentId: ID, beforeId: ID | null) {
    addCommand(node, {
        type: 'createDom',
        parentId,
        beforeId,
        rootId: findRootId(node),
        id: node.id,
        attrs: node.props,
        tag: node.type,
    });
    mountChildren(node, node.id, null);
    if (node.type === 'select') {
        updateSelectValue(node);
    }
    return node;
}

function mountChildren(node: VChildrenNodeCreated, parentId: ID, beforeId: ID | null) {
    for (let i = 0; i < node.children.length; i++) {
        node.children[i] = mountVNode(norm(node.children[i]), parentId, beforeId);
    }
}
