function updateVNode(node: VNode, oldNode: VNode, parentId: ID) {
    if (node.kind !== oldNode.kind) {
        createVNode(node, parentId, findChildVDom(oldNode).id);
        removeVNode(oldNode);
        return;
    }
    if (node.kind === componentKind) {
        updateComponent(node, oldNode as VComponentNode, parentId);
    } else if (node.kind === domKind) {
        updateDom(node, oldNode as VDomNode, parentId);
    } else if (node.kind === textKind) {
        updateText(node, oldNode as VTextNode);
    } else if (node.kind === arrayKind) {
        updateArray(node, oldNode as VArrayNode);
    } else if (node.kind === portalKind) {
        updatePortal(node, oldNode as VPortalNode, parentId);
    }
}

function updateComponent(node: VComponentNode, oldNode: VComponentNode, parentId: ID) {
    runComponent(node);
    node.id = parentId;
    if (node.type !== oldNode.type) {
        createVNode(node.children, parentId, findChildVDom(oldNode).id);
        removeVNode(oldNode);
    } else {
        updateVNode(node.children, oldNode.children, parentId);
    }
}

function updateDom(node: VDomNode, oldNode: VDomNode, parentId: ID) {
    if (node.type !== oldNode.type) {
        createVNode(node, parentId, oldNode.id);
        removeVNode(oldNode);
    } else {
        node.id = oldNode.id;
        const len = Math.min(node.children.length, oldNode.children.length);
        const diffProps = updateProps(node.props, oldNode.props);
        if (diffProps.length > 0) {
            commandList.push({type: 'updateDom', id: node.id, props: diffProps});
        }
        for (let i = 0; i < len; i++) {
            const child = norm(node.children[i]);
            const oldChild = oldNode.children[i] as VNode;
            updateVNode(child, oldChild, node.id);
        }
        for (let i = len; i < node.children.length; i++) {
            const child = norm(node.children[i]);
            createVNode(child, node.id, null);
        }
        for (let i = len; i < oldNode.children.length; i++) {
            const oldChild = oldNode.children[i] as VNode;
            removeVNode(oldChild);
        }
    }
    return node;
}

function updateText(node: VTextNode, oldNode: VTextNode) {
    node.id = oldNode.id;
    if (node.children !== oldNode.children) {
        commandList.push({type: 'setText', id: node.id, text: node.children});
    }
}

function updateArray(node: VArrayNode, oldNode: VArrayNode) {}

function updatePortal(node: VPortalNode, oldNode: VPortalNode, parentId: ID) {
    if (node.type !== oldNode.type) {
        createVNode(node, parentId, findChildVDom(oldNode).id);
        removeVNode(oldNode);
    } else {
    }
}
