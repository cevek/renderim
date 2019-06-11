function mountOrUpdate(parentNode: ParentComponent, node: VNodeCreated, oldNode: VNode | undefined, parentId: ID, beforeId: ID | null) {
    if (oldNode === undefined) {
        return mountVNode(parentNode, node, parentId, beforeId);
    }
    return updateVNode(parentNode, node, oldNode, parentId);
}

function replaceVNode(parentNode: ParentComponent, node: VNodeCreated, oldNode: VNode, parentId: ID) {
    const newNode = mountVNode(parentNode, node, parentId, findChildVDom(oldNode).id);
    removeVNode(oldNode, true);
    return newNode;
}

function updateVNode(parentNode: ParentComponent, node: VNodeCreated, oldNode: VNode, parentId: ID): VNode {
    assert(oldNode.status === 'active');
    if (oldNode === node && getPersistId(oldNode.parentComponent) === getPersistId(parentNode)) {
        maybeUpdatedParent.push({newParent: parentNode, node: oldNode});
        return oldNode;
    }
    if (node.status === 'active') {
        node = cloneVNode(node);
    }
    assert(node.status === 'created');
    (node as NoReadonly<VNode>).parentComponent = parentNode;
    if (node.kind !== oldNode.kind) {
        return replaceVNode(parentNode, node, oldNode, parentId);
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

function finalUpdate(node: VNodeCreated, oldNode: VNode) {
    (node as NoReadonly<VNode>).status = 'active';
    maybeObsolete.push(oldNode);
    maybeCancelled.push(node);
}

function updateComponent(node: VComponentNodeCreated, oldNode: VComponentNode, parentId: ID): VComponentNode {
    assert(node.status === 'created');
    assert(oldNode.status === 'active');
    if (node.type !== oldNode.type) {
        return replaceVNode(node.parentComponent, node, oldNode, parentId) as VComponentNode;
    }
    node.id = parentId;
    node.state = oldNode.state;
    runComponent(node);
    if (node.type === ErrorBoundary) {
        node = handleErrorBoundary(node as VErrorBoundaryNodeCreated, oldNode.children, parentId, null);
    } else if (node.type === Suspense) {
        node = handleSuspense(node as VSuspenseNodeCreated, oldNode.children, parentId, null);
    } else if (node.type === SuspenseContent) {
        const oldChild = oldNode !== undefined && oldNode.children.status !== 'active' ? undefined : oldNode.children;
        if (oldChild !== undefined) {
            node.children = updateVNode(node, norm(node.children), oldChild, parentId);
        } else {
            node.children = mountVNode(node, norm(node.children), parentId, null);
        }
    } else {
        node.children = updateVNode(node, norm(node.children), oldNode.children, parentId);
    }
    finalUpdate(node, oldNode);
    return node as VComponentNode;
}

function updateDom(node: VDomNodeCreated, oldNode: VDomNode, parentId: ID) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node.parentComponent, node, oldNode, parentId);
    }
    (node as NoReadonly<VDomNode>).id = oldNode.id;
    const props = node.props as JSX.IntrinsicElements[string];
    const len = Math.min(node.children.length, oldNode.children.length);
    const diffAttrs = updateAttrs(node.props, oldNode.props);
    if (diffAttrs !== undefined) {
        addCommand(node, {
            action: 'update',
            group: 'tag',
            tag: node.type,
            id: node.id,
            attrs: diffAttrs,
        });
    }
    for (let i = 0; i < len; i++) {
        const oldChild = oldNode.children[i] as VNode;
        node.children[i] = updateVNode(node, norm(node.children[i]), oldChild, parentId);
    }
    for (let i = len; i < node.children.length; i++) {
        node.children[i] = mountVNode(node, norm(node.children[i]), node.id, null);
    }
    for (let i = len; i < oldNode.children.length; i++) {
        const oldChild = oldNode.children[i] as VNode;
        removeVNode(oldChild, true);
    }
    if (diffAttrs !== undefined && node.type === 'select') {
        updateSelectValue(node);
    }
    if (props.customChild !== undefined) {
        addCommand(node, {
            action: 'update',
            group: 'custom',
            parentId: node.id,
            data: props.customChild.data,
            name: props.customChild.name,
            url: customUrl(props.customChild),
        });
    }
    finalUpdate(node, oldNode);
    return node as VDomNode;
}

function updateText(node: VTextNodeCreated, oldNode: VTextNode) {
    (node as NoReadonly<VTextNode>).id = oldNode.id;
    if (node.children !== oldNode.children) {
        addCommand(node, {action: 'update', group: 'text', id: node.id, text: node.children});
    }
    finalUpdate(node, oldNode);
    return node as VTextNode;
}

function updatePortal(node: VPortalNodeCreated, oldNode: VPortalNode) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node.parentComponent, node, oldNode, node.type);
    }
    node.children = updateVNode(node, norm(node.children), oldNode.children as VNode, node.type);
    finalUpdate(node, oldNode);
    return node as VPortalNode;
}
