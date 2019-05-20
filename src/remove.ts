function removeVNode(node: VNode, realRemove: boolean) {
    removedNodes.add(node);
    assert(node.status === 'active');
    if (node.kind === componentKind) {
        if (node.type === ErrorBoundary) {
            // allErrorBoundaries.delete(node as VErrorBoundaryNode);
        }
        if (node.type === Suspense) {
            // allSuspenses.delete(node as VSuspenseNode);
        }
        removeVNode(node.children, realRemove);
        node.status = 'removed';
    } else if (node.kind === domKind) {
        if (realRemove) {
            addCommand({type: 'removeDom', id: node.id});
        }
        removeChildren(node, false);
    } else if (node.kind === textKind) {
        if (realRemove) {
            addCommand({type: 'removeText', id: node.id});
        }
        node.status = 'removed';
    } else if (node.kind === arrayKind) {
        removeChildren(node, realRemove);
        node.status = 'removed';
    } else if (node.kind === portalKind) {
        removeChildren(node, realRemove);
        node.status = 'removed';
    }
}

function removeChildren(node: VDomNode | VArrayNode | VPortalNode, realRemove: boolean) {
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i] as VNode;
        removeVNode(child, realRemove);
    }
}
