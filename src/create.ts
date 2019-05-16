function createVNode(node: VNode, parentId: ID, beforeId: ID | null) {
    if (node.kind === componentKind) {
        runComponent(node);
        node.id = parentId;
        createVNode(node.children, parentId, beforeId);
        return node;
    }
    if (node.kind === domKind) {
        commandList.push({
            type: 'createDom',
            parentId,
            beforeId,
            id: node.id,
            props: node.props,
            tag: node.type,
        });
        createChildren(node, node.id, null);
        return node;
    }
    if (node.kind === textKind) {
        commandList.push({type: 'createText', parentId, beforeId, id: node.id, text: node.children});
        return node;
    }
    if (node.kind === arrayKind) {
        createChildren(node, parentId, beforeId);
        return node;
    }
    if (node.kind === portalKind) {
        createChildren(node, node.type, null);
        return node;
    }
    throw never(node);
}

function createChildren(node: VChildrenNode, parentId: ID, beforeId: ID | null) {
    for (let i = 0; i < node.children.length; i++) {
        createChild(node, i, norm(node.children[i]), parentId, beforeId);
    }
}

function createChild(parent: VChildrenNode, index: number, node: VNode, parentId: ID, beforeId: ID | null) {
    const newNode = createVNode(node, parentId, beforeId);
    parent.children[index] = newNode;
    return newNode;
}
