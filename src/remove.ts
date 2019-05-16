function removeVNode(node: VNode) {
    if (node.kind === componentKind) {
        removeVNode(node.children);
    } else if (node.kind === domKind) {
        commandList.push({type: 'removeDom', id: node.id});
        removeChildren(node);
    } else if (node.kind === textKind) {
        commandList.push({type: 'removeText', id: node.id});
    } else if (node.kind === arrayKind) {
        removeChildren(node);
    } else if (node.kind === portalKind) {
        removeChildren(node);
    }
}

function removeChildren(node: VDomNode | VArrayNode | VPortalNode) {
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i] as VNode;
        removeVNode(child);
    }
}
