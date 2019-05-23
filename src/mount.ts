function mountVNode(node: VNode, parentId: ID, beforeId: ID | null) {
    if (node.status === 'active') {
        node = cloneVNode(node);
    }
    assert(node.status === 'created');
    (node as NoReadonly<VNode>).parentComponent = currentComponent;
    if (node.kind === componentKind) {
        node = mountComponent(node, parentId, beforeId);
    } else if (node.kind === domKind) {
        node = mountVDom(node, parentId, beforeId);
    } else if (node.kind === textKind) {
        addCommand(node, {type: 'createText', parentId, beforeId, id: node.id, text: node.children});
    } else if (node.kind === arrayKind) {
        mountChildren(node, parentId, beforeId);
    } else if (node.kind === portalKind) {
        mountChildren(node, node.type, null);
    } else {
        throw never(node);
    }
    (node as NoReadonly<VNode>).status = 'active';
    maybeCancelled.push(node);
    return node;
}

function mountComponent(node: VComponentNode, parentId: ID, beforeId: ID | null): VComponentNode {
    runComponent(node);
    const parentComponent = currentComponent;
    currentComponent = node;
    (node as NoReadonly<VComponentNode>).id = parentId;
    if (node.type === ErrorBoundary) {
        node = handleErrorBoundary(node as VErrorBoundaryNode, undefined, parentId, beforeId);
    } else if (node.type === Suspense) {
        node = handleSuspense(node as VSuspenseNode, undefined, parentId, beforeId);
    } else {
        (node as NoReadonly<VComponentNode>).children = mountVNode(node.children, parentId, beforeId);
    }
    currentComponent = parentComponent;
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
    return node;
}

function mountChildren(node: VChildrenNode, parentId: ID, beforeId: ID | null) {
    for (let i = 0; i < node.children.length; i++) {
        (node.children as VNode[])[i] = mountVNode(norm(node.children[i]), parentId, beforeId);
    }
}
