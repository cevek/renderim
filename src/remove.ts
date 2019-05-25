function removeVNode(node: VNode, realRemove: boolean) {
    maybeRemoved.push(node);
    assert(node.status === 'active');
    if (node.kind === componentKind) {
        removeVNode(node.children, realRemove);
    } else if (node.kind === domKind) {
        if (realRemove) {
            addCommand(node, {type: 'removeNode', id: node.id});
        }
        removeChildren(node, false);
    } else if (node.kind === textKind) {
        if (realRemove) {
            addCommand(node, {type: 'removeNode', id: node.id});
        }
    } else if (node.kind === arrayKind) {
        removeChildren(node, realRemove);
    } else if (node.kind === portalKind) {
        removeVNode(node.children, true);
    }
}

function removeChildren(node: VChildrenNode, realRemove: boolean) {
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        removeVNode(child, realRemove);
    }
}
