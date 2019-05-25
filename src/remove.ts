function removeVNode(node: VNode, realRemove: boolean) {
    maybeRemoved.push(node);
    assert(node.status === 'active');
    if (node.kind === componentKind) {
        if (node.type === ErrorBoundary) {
            // allErrorBoundaries.delete(node as VErrorBoundaryNode);
        }
        if (node.type === Suspense) {
            // allSuspenses.delete(node as VSuspenseNode);
        }
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
        removeVNode(node.children as VNode, true);
    }
}

function removeChildren(node: VChildrenNode, realRemove: boolean) {
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i] as VNode;
        removeVNode(child, realRemove);
    }
}
