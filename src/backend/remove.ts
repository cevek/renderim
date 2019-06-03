function removeVNode(node: VNode, realRemove: boolean) {
    maybeRemoved.push(node);
    assert(node.status === 'active');
    if (node.kind === componentKind) {
        removeVNode(node.children, realRemove);
    } else if (node.kind === domKind) {
        const props = node.props as JSX.IntrinsicElements[string];
        if (props.customChild !== undefined) {
            addCommand(node, {
                action: 'remove',
                group: 'custom',
                parentId: node.id,
                data: node.props,
                name: node.type,
            });
        }
        removeChildren(node, false);
        if (realRemove) {
            addCommand(node, {action: 'remove', group: 'tag', tag: node.type, id: node.id});
        }
    } else if (node.kind === textKind) {
        if (realRemove) {
            addCommand(node, {action: 'remove', group: 'text', id: node.id});
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
