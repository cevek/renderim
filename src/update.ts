function updateVNode(node: VNode, oldNode: VNode, parentId: ID): VNode {
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

function updateComponent(node: VComponentNode, oldNode: VComponentNode, parentId: ID) {
    runComponent(node);
    node.id = parentId;
    if (node.type !== oldNode.type) {
        return replaceVNode(node, oldNode, parentId);
    }
    return updateVNode(node.children, oldNode.children, parentId);
}

function updateDom(node: VDomNode, oldNode: VDomNode, parentId: ID) {
    if (node.type !== oldNode.type) {
        return replaceVNode(node, oldNode, parentId);
    }
    node.id = oldNode.id;
    const len = Math.min(node.children.length, oldNode.children.length);
    const diffProps = updateProps(node.props, oldNode.props);
    if (diffProps.length > 0) {
        commandList.push({type: 'updateDom', id: node.id, props: diffProps});
    }
    for (let i = 0; i < len; i++) {
        const oldChild = oldNode.children[i] as VNode;
        updateChild(node, i, norm(node.children[i]), oldChild, node.id);
    }
    for (let i = len; i < node.children.length; i++) {
        createChild(node, i, norm(node.children[i]), node.id, null);
    }
    for (let i = len; i < oldNode.children.length; i++) {
        const oldChild = oldNode.children[i] as VNode;
        removeVNode(oldChild);
    }
    return node;
}

function updateText(node: VTextNode, oldNode: VTextNode) {
    node.id = oldNode.id;
    if (node.children !== oldNode.children) {
        commandList.push({type: 'setText', id: node.id, text: node.children});
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
    parent.children[index] = newNode;
    return newNode;
}

function replaceVNode(node: VNode, oldNode: VNode, parentId: ID) {
    const newNode = createVNode(node, parentId, findChildVDom(oldNode).id);
    removeVNode(oldNode);
    return newNode;
}
