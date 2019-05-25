function mountOrUpdate(node: VNode, oldNode: VNode | undefined, parentId: ID, beforeId: ID | null) {
    if (oldNode === undefined) {
        return mountVNode(node, parentId, beforeId);
    }
    return updateVNode(node, oldNode, parentId);
}
function updateVNode(node: VNode, oldNode: VNode, parentId: ID): VNode {
    assert(oldNode.status === 'active');
    if (oldNode === node) {
        maybeUpdatedParent.push({newParent: currentComponent, node: node});
        return node;
    }
    if (node.status === 'active') {
        node = cloneVNode(node);
    }
    assert(node.status === 'created');
    (node as NoReadonly<VNode>).parentComponent = currentComponent;
    if (node.kind !== oldNode.kind) {
        return replaceVNode(node, oldNode, parentId);
    }
    if (node.kind === componentKind) {
        return updateComponent(node, oldNode as VComponentNode, parentId);
    }
    if (node.kind === domKind) {
        return updateDom(node, oldNode as VDomNode, parentId);
    }
    if (node.kind === textKind) {
        return updateText(node, oldNode as VTextNode);
    }
    if (node.kind === arrayKind) {
        return updateArray(node, oldNode as VArrayNode, parentId);
    }
    if (node.kind === portalKind) {
        return updatePortal(node, oldNode as VPortalNode);
    }
    throw never(node);
}

function finalUpdate(node: VNode, oldNode: VNode) {
    (node as NoReadonly<VNode>).status = 'active';
    maybeObsolete.push(oldNode);
    maybeCancelled.push(node);
}

function updateComponent(node: VComponentNode, oldNode: VComponentNode, parentId: ID): VComponentNode {
    assert(node.status === 'created');
    assert(oldNode.status === 'active');
    const parentComponent = currentComponent;
    currentComponent = node;
    runComponent(node);
    const noReadonlyNode = node as NoReadonly<VComponentNode>;
    noReadonlyNode.id = parentId;
    if (node.type !== oldNode.type) {
        return replaceVNode(node, oldNode, parentId) as VComponentNode;
    }
    if (node.type === ErrorBoundary) {
        noReadonlyNode.extra = oldNode.extra;
        node = handleErrorBoundary(node as VErrorBoundaryNode, oldNode.children, parentId, null);
    } else if (node.type === Suspense) {
        noReadonlyNode.extra = oldNode.extra;
        node = handleSuspense(node as VSuspenseNode, oldNode.children, parentId, null);
    } else {
        noReadonlyNode.children = updateVNode(node.children, oldNode.children, parentId);
    }
    currentComponent = parentComponent;
    finalUpdate(node, oldNode);
    return node;
}

function updateDom(node: VDomNode, oldNode: VDomNode, parentId: ID) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node, oldNode, parentId);
    }
    (node as NoReadonly<VDomNode>).id = oldNode.id;
    const len = Math.min(node.children.length, oldNode.children.length);
    const diffAttrs = updateAttrs(node.props, oldNode.props);
    if (diffAttrs !== undefined) {
        addCommand(node, {type: 'updateDom', tag: node.type, id: node.id, attrs: diffAttrs});
    }
    for (let i = 0; i < len; i++) {
        const oldChild = oldNode.children[i] as VNode;
        (node.children as VNode[])[i] = updateVNode(norm(node.children[i]), oldChild, parentId);
    }
    for (let i = len; i < node.children.length; i++) {
        (node.children as VNode[])[i] = mountVNode(norm(node.children[i]), node.id, null);
    }
    for (let i = len; i < oldNode.children.length; i++) {
        const oldChild = oldNode.children[i] as VNode;
        removeVNode(oldChild, true);
    }
    if (diffAttrs !== undefined && node.type === 'select') {
        updateSelectValue(node);
    }
    finalUpdate(node, oldNode);
    return node;
}

function updateText(node: VTextNode, oldNode: VTextNode) {
    (node as NoReadonly<VTextNode>).id = oldNode.id;
    if (node.children !== oldNode.children) {
        addCommand(node, {type: 'setText', id: node.id, text: node.children});
    }
    finalUpdate(node, oldNode);
    return node;
}

function updatePortal(node: VPortalNode, oldNode: VPortalNode) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node, oldNode, node.type);
    }
    (node as NoReadonly<VPortalNode>).children = updateVNode(norm(node.children), oldNode.children as VNode, node.type);
    finalUpdate(node, oldNode);
    return node;
}

function replaceVNode(node: VNode, oldNode: VNode, parentId: ID) {
    const newNode = mountVNode(node, parentId, findChildVDom(oldNode).id);
    removeVNode(oldNode, true);
    return newNode;
}
