function mountOrUpdate(node: VNode, oldNode: VNode | undefined, parentId: ID, beforeId: ID | null) {
    if (oldNode === undefined) {
        return mountVNode(node, parentId, beforeId);
    }
    return updateVNode(node, oldNode, parentId);
}
function updateVNode(node: VNode, oldNode: VNode, parentId: ID): VNode {
    assert(oldNode.status === 'active');
    assert(oldNode.suspense.extra === currentSuspense.extra);
    assert(oldNode.errorBoundary.extra === currentErrorBoundary.extra);
    // oldNode saves old errorBoundary and suspense
    if (oldNode === node) return node;
    if (node.status === 'active') {
        node = cloneVNode(node);
    }
    assert(node.status === 'created');
    node.errorBoundary = currentErrorBoundary;
    node.suspense = currentSuspense;
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
        return updatePortal(node, oldNode as VPortalNode, parentId);
    }
    throw never(node);
}

function updateComponent(node: VComponentNode, oldNode: VComponentNode, parentId: ID): VComponentNode {
    assert(node.status === 'created');
    assert(oldNode.status === 'active');
    runComponent(node);
    node.id = parentId;
    if (node.type !== oldNode.type) {
        return replaceVNode(node, oldNode, parentId) as VComponentNode;
    }
    if (node.type === ErrorBoundary) {
        node.extra = oldNode.extra;
        // allErrorBoundaries.delete(oldNode as VErrorBoundaryNode);
        node = handleErrorBoundary(node as VErrorBoundaryNode, oldNode.children, parentId, null);
    } else if (node.type === Suspense) {
        // allSuspenses.delete(oldNode as VSuspenseNode);
        node.extra = oldNode.extra;
        node = handleSuspense(node as VSuspenseNode, oldNode.children, parentId, null);
    } else {
        node.children = updateVNode(node.children, oldNode.children, parentId);
    }
    node.status = 'active';
    maybeObsolete.push(oldNode);
    maybeCancelled.push(node);
    return node;
}

function updateDom(node: VDomNode, oldNode: VDomNode, parentId: ID) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node, oldNode, parentId);
    }
    node.id = oldNode.id;
    const len = Math.min(node.children.length, oldNode.children.length);
    const diffProps = updateProps(node.props, oldNode.props);
    if (diffProps.length > 0) {
        addCommand(node, {type: 'updateDom', id: node.id, props: diffProps});
    }
    for (let i = 0; i < len; i++) {
        const oldChild = oldNode.children[i] as VNode;
        updateChild(node, i, norm(node.children[i]), oldChild, node.id);
    }
    for (let i = len; i < node.children.length; i++) {
        mountChild(node, i, norm(node.children[i]), node.id, null);
    }
    for (let i = len; i < oldNode.children.length; i++) {
        const oldChild = oldNode.children[i] as VNode;
        removeVNode(oldChild, true);
    }
    node.status = 'active';
    maybeObsolete.push(oldNode);
    maybeCancelled.push(node);
    return node;
}

function updateText(node: VTextNode, oldNode: VTextNode) {
    node.id = oldNode.id;
    if (node.children !== oldNode.children) {
        addCommand(node, {type: 'setText', id: node.id, text: node.children});
    }
    node.status = 'active';
    maybeObsolete.push(oldNode);
    maybeCancelled.push(node);
    return node;
}

function updatePortal(node: VPortalNode, oldNode: VPortalNode, parentId: ID) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node, oldNode, parentId);
    }
    node.status = 'active';
    maybeObsolete.push(oldNode);
    maybeCancelled.push(node);
    return node;
}

function updateChild(parent: VChildrenNode, index: number, childNode: VNode, oldChildNode: VNode, parentId: ID) {
    const newNode = updateVNode(childNode, oldChildNode, parentId);
    parent.children[index] = newNode;
    return newNode;
}

function replaceVNode(node: VNode, oldNode: VNode, parentId: ID) {
    const newNode = mountVNode(node, parentId, findChildVDom(oldNode).id);
    removeVNode(oldNode, true);
    return newNode;
}
