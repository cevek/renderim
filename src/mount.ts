function mountVNode(node: VNode, parentId: ID, beforeId: ID | null) {
    if (node.status === 'active') {
        node = cloneVNode(node);
    }
    assert(node.status === 'created');
    node.errorBoundary = currentErrorBoundary;
    node.suspense = currentSuspense;
    if (node.kind === componentKind) {
        return mountComponent(node, parentId, beforeId);
    }
    if (node.kind === domKind) {
        return mountVDom(node, parentId, beforeId);
    }
    if (node.kind === textKind) {
        addCommand(node, {type: 'createText', parentId, beforeId, id: node.id, text: node.children});
        node.status = 'active';
        maybeCancelled.push(node);
        return node;
    }
    if (node.kind === arrayKind) {
        mountChildren(node, parentId, beforeId);
        node.status = 'active';
        maybeCancelled.push(node);
        return node;
    }
    if (node.kind === portalKind) {
        mountChildren(node, node.type, null);
        node.status = 'active';
        maybeCancelled.push(node);
        return node;
    }
    throw never(node);
}

function mountComponent(node: VComponentNode, parentId: ID, beforeId: ID | null): VComponentNode {
    runComponent(node);
    node.id = parentId;
    if (node.type === ErrorBoundary) {
        node = handleErrorBoundary(node as VErrorBoundaryNode, child => mountVNode(child, parentId, beforeId));
    } else if (node.type === Suspense) {
        node = handleSuspense(node as VSuspenseNode, false, undefined, parentId, beforeId);
    } else {
        node.children = mountVNode(node.children, parentId, beforeId);
    }
    node.status = 'active';
    maybeCancelled.push(node);
    return node;
}

function mountVDom(node: VDomNode, parentId: ID, beforeId: ID | null) {
    addCommand(node, {
        type: 'createDom',
        parentId,
        beforeId,
        id: node.id,
        props: node.props,
        tag: node.type,
    });
    mountChildren(node, node.id, null);
    node.status = 'active';
    maybeCancelled.push(node);
    return node;
}

function mountChildren(node: VChildrenNode, parentId: ID, beforeId: ID | null) {
    for (let i = 0; i < node.children.length; i++) {
        mountChild(node, i, norm(node.children[i]), parentId, beforeId);
    }
}

function mountChild(parent: VChildrenNode, index: number, node: VNode, parentId: ID, beforeId: ID | null) {
    const newNode = mountVNode(node, parentId, beforeId);
    parent.children[index] = newNode;
    return newNode;
}
