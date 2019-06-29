function removeVNode(node: VNode, realRemove: boolean) {
    updatings.push({kind: 'removed', node});
    assert(node.status === 'active');
    if (node.kind === componentKind) {
        removeVNode(node.children, realRemove);
    } else if (node.kind === domKind) {
        const props = node.props as JSX.IntrinsicElements[string];
        if (props.withCommand !== undefined) {
            addCommand(node, {
                action: 'remove',
                group: 'custom',
                parentId: node.id,
                data: props.withCommand.data,
                name: props.withCommand.name,
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

function removeChildren(node: VDomNode | VArrayNode, realRemove: boolean) {
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        removeVNode(child, realRemove);
    }
}
