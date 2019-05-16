function createVNode(node: VNode, parentId: ID, beforeId: ID | null) {
    if (node.kind === componentKind) {
        runComponent(node);
        node.id = parentId;
        createVNode(node.children, parentId, beforeId);
    } else if (node.kind === domKind) {
        commandList.push({
            type: 'createDom',
            parentId,
            beforeId,
            id: node.id,
            props: createPropsFromObj(node.props),
            tag: node.type,
        });
        createChildren(node, node.id, null);
    } else if (node.kind === textKind) {
        commandList.push({type: 'createText', parentId, beforeId, id: node.id, text: node.children});
    } else if (node.kind === arrayKind) {
        createChildren(node, parentId, beforeId);
    } else if (node.kind === portalKind) {
        createChildren(node, node.type, null);
    }
}

function createChildren(node: VDomNode | VArrayNode | VPortalNode, parentId: ID, beforeId: ID | null) {
    for (let i = 0; i < node.children.length; i++) {
        const child = norm(node.children[i]);
        createVNode(child, parentId, beforeId);
    }
}

