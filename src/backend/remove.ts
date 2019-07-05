function removeVNode(node: VNode, realRemove: boolean) {
    GLOBAL_TASKS.push({kind: 'removed', node});
    assert(node.status === 'active');
    if (node.kind === COMPONENT_KIND) {
        removeVNode(node.children, realRemove);
    } else if (node.kind === DOM_KIND) {
        const props = node.props as JSX.IntrinsicElements[string];
        if (props.withCommand !== undefined) {
            addCommand(node, {
                action: 'remove',
                group: 'custom',
                parentId: node.instance,
                data: props.withCommand.data,
                name: props.withCommand.name,
            });
        }
        removeChildren(node, false);
        if (realRemove) {
            addCommand(node, {action: 'remove', group: 'tag', tag: node.type, id: node.instance});
        }
    } else if (node.kind === TEXT_KIND) {
        if (realRemove) {
            addCommand(node, {action: 'remove', group: 'text', id: node.instance});
        }
    } else if (node.kind === ARRAY_KIND) {
        removeChildren(node, realRemove);
    } else if (node.kind === PORTAL_KIND) {
        removeVNode(node.children, true);
    }
}

function removeChildren(node: VDomNode | VArrayNode, realRemove: boolean) {
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        removeVNode(child, realRemove);
    }
}
