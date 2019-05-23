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
        node = updateComponent(node, oldNode as VComponentNode, parentId);
    } else if (node.kind === domKind) {
        node = updateDom(node, oldNode as VDomNode, parentId);
    } else if (node.kind === textKind) {
        node = updateText(node, oldNode as VTextNode);
    } else if (node.kind === arrayKind) {
        node = updateArray(node, oldNode as VArrayNode, parentId);
    } else if (node.kind === portalKind) {
        node = updatePortal(node, oldNode as VPortalNode, parentId);
    } else {
        throw never(node);
    }

    (node as NoReadonly<VNode>).status = 'active';
    maybeObsolete.push(oldNode);
    maybeCancelled.push(node);
    return node;
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
    return node;
}

function updateDom(node: VDomNode, oldNode: VDomNode, parentId: ID) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node, oldNode, parentId);
    }
    (node as NoReadonly<VDomNode>).id = oldNode.id;
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
    return node;
}

function updateText(node: VTextNode, oldNode: VTextNode) {
    (node as NoReadonly<VTextNode>).id = oldNode.id;
    if (node.children !== oldNode.children) {
        addCommand(node, {type: 'setText', id: node.id, text: node.children});
    }
    return node;
}

function updatePortal(node: VPortalNode, oldNode: VPortalNode, parentId: ID) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node, oldNode, parentId);
    }
    return node;
}

function updateChild(parent: VChildrenNode, index: number, childNode: VNode, oldChildNode: VNode, parentId: ID) {
    const newNode = updateVNode(childNode, oldChildNode, parentId);
    (parent.children as NoReadonly<Return[]>)[index] = newNode;
    return newNode;
}

function replaceVNode(node: VNode, oldNode: VNode, parentId: ID) {
    const newNode = mountVNode(node, parentId, findChildVDom(oldNode).id);
    removeVNode(oldNode, true);
    return newNode;
}
