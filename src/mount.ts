function mountVNode(node: VNode, parentId: ID, beforeId: ID | null) {
    if (node.kind === componentKind) {
        return mountComponent(node, parentId, beforeId);
    }
    if (node.kind === domKind) {
        return mountVDom(node, parentId, beforeId);
    }
    if (node.kind === textKind) {
        commandList.push({type: 'createText', parentId, beforeId, id: node.id, text: node.children});
        return node;
    }
    if (node.kind === arrayKind) {
        mountChildren(node, parentId, beforeId);
        return node;
    }
    if (node.kind === portalKind) {
        mountChildren(node, node.type, null);
        return node;
    }
    throw never(node);
}

function mountComponent(node: VComponentNode, parentId: ID, beforeId: ID | null): VNode {
    runComponent(node);
    node.id = parentId;
    if (node.type === ErrorBoundary) {
        const commandListEnd = commandList.length;
        try {
            return mountVNode(node.children, parentId, beforeId);
        } catch (err) {
            clearCommandsUntil(commandListEnd);
            return mountComponent(createFallback(node, err), parentId, beforeId);
        }
    }
    return mountVNode(node.children, parentId, beforeId);
}

function mountVDom(node: VDomNode, parentId: ID, beforeId: ID | null) {
    commandList.push({
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
        mountChild(node, i, norm(node.children[i]), parentId, beforeId);
    }
}

function mountChild(parent: VChildrenNode, index: number, node: VNode, parentId: ID, beforeId: ID | null) {
    const newNode = mountVNode(node, parentId, beforeId);
    parent.children[index] = newNode;
    return newNode;
}
