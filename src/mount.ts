function mountVNode(node: VNode, parentId: ID, beforeId: ID | null) {
    if (node.kind === componentKind) {
        runComponent(node);
        node.id = parentId;
        mountVNode(node.children, parentId, beforeId);
        return node;
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

function mountVDom(node: VDomNode, parentId: ID, beforeId: ID | null) {
    if (node.children.length === 1) {
        const child = norm(node.children[0]);
        node.children[0] = child;
        if (child.kind === textKind && child.children !== '') {
            commandList.push({
                type: 'createDomWithText',
                parentId,
                beforeId,
                id: node.id,
                textId: child.id,
                text: child.children,
                props: node.props,
                tag: node.type,
            });
            return node;
        }
    }
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
        createChild(node, i, norm(node.children[i]), parentId, beforeId);
    }
}

function createChild(parent: VChildrenNode, index: number, node: VNode, parentId: ID, beforeId: ID | null) {
    const newNode = mountVNode(node, parentId, beforeId);
    parent.children[index] = newNode;
    return newNode;
}
