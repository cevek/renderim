function replaceVNode<T extends VNode>(parentNode: ParentComponent, node: VNodeCreated, oldNode: VNode, parentId: ID) {
    const newNode = mountVNode(parentNode, node, parentId, findChildVDom(oldNode).id);
    removeVNode(oldNode, true);
    return newNode as T;
}

function updateVNode(parentNode: ParentComponent, node: VNodeCreated, oldNode: VNode, parentId: ID): VNode {
    assert(oldNode.status === 'active');
    if (oldNode === node && getPersistId(oldNode.parentComponent) === getPersistId(parentNode)) {
        maybeUpdatedParent.push({newParent: parentNode, node: oldNode});
        return oldNode;
    }
    if (node.status === 'active') {
        node = cloneVNode(node, undefined, false);
    }
    assert(node.status === 'created');
    node.parentComponent = parentNode;
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

function afterUpdate<T extends VNode>(node: VNodeCreated) {
    node.status = 'active';
    return node as T;
}
function beforeUpdate(node: VNodeCreated, oldNode: VNode) {
    assert(!maybeObsolete.includes(oldNode));
    assert(!maybeCancelled.includes(node));
    maybeObsolete.push(oldNode);
    maybeCancelled.push(node);
}

function updateComponent(node: VComponentNodeCreated, oldNode: VComponentNode, parentId: ID): VComponentNode {
    assert(node.status === 'created');
    assert(oldNode.status === 'active');
    if (node.type !== oldNode.type) {
        return replaceVNode(node.parentComponent, node, oldNode, parentId);
    }
    beforeUpdate(node, oldNode);
    node.id = parentId;
    node.state = oldNode.state;
    runComponent(node);
    node.children = updateVNode(node, norm(node.children), oldNode.children, parentId);
    return afterUpdate(node);
}

function updateDom(node: VDomNodeCreated, oldNode: VDomNode, parentId: ID): VDomNode {
    if (node.type !== oldNode.type) {
        return replaceVNode(node.parentComponent, node, oldNode, parentId);
    }
    beforeUpdate(node, oldNode);
    node.id = oldNode.id;
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
        const oldChild = oldNode.children[i];
        node.children[i] = updateVNode(node, norm(node.children[i]), oldChild, node.id);
    }
    for (let i = len; i < node.children.length; i++) {
        node.children[i] = mountVNode(node, norm(node.children[i]), node.id, null);
    }
    for (let i = len; i < oldNode.children.length; i++) {
        const oldChild = oldNode.children[i];
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
    return afterUpdate(node);
}

function updateText(node: VTextNodeCreated, oldNode: VTextNode): VTextNode {
    node.id = oldNode.id;
    beforeUpdate(node, oldNode);
    if (node.children !== oldNode.children) {
        addCommand(node, {action: 'update', group: 'text', id: node.id, text: node.children});
    }
    return afterUpdate(node);
}

function updatePortal(node: VPortalNodeCreated, oldNode: VPortalNode): VPortalNode {
    if (node.type !== oldNode.type) {
        return replaceVNode(node.parentComponent, node, oldNode, node.type);
    }
    beforeUpdate(node, oldNode);
    node.children = updateVNode(node, norm(node.children), oldNode.children, node.type);
    return afterUpdate(node);
}
