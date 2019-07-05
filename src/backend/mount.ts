function mountVNode(parentNode: ParentComponent, node: VNodeCreated, parentId: ID, beforeId: ID | null): VNode {
    if (node.status === 'active') {
        node = cloneVNode(node, undefined, false);
    }
    assert(node.status === 'created');
    // assert(!maybeCancelled.includes(node));
    GLOBAL_TASKS.push({kind: 'created', node: node})

    node.parentComponent = parentNode;
    if (node.kind === COMPONENT_KIND) {
        node = mountComponent(node, parentId, beforeId);
    } else if (node.kind === DOM_KIND) {
        node = mountVDom(node, parentId, beforeId);
    } else if (node.kind === TEXT_KIND) {
        addCommand(node, {
            action: 'create',
            group: 'text',
            rootId: findRootId(node),
            parentId,
            beforeId,
            id: node.instance,
            text: node.children,
        });
    } else if (node.kind === ARRAY_KIND) {
        for (let i = 0; i < node.children.length; i++) {
            mountChild(node, i, parentId, beforeId);
        }
    } else if (node.kind === PORTAL_KIND) {
        node.children = mountVNode(node, norm(node.children), node.instance, null);
    } else {
        throw never(node);
    }
    node.status = 'active';
    return node as VNode;
}

function mountComponent(node: VComponentNodeCreated, parentId: ID, beforeId: ID | null): VComponentNodeCreated {
    node.instance.parentDom = parentId;
    const newChildren = runComponent(node);
    node.children = mountVNode(node, newChildren, parentId, beforeId);
    return node;
}

function mountVDom(node: VDomNodeCreated, parentId: ID, beforeId: ID | null) {
    const props = node.props as JSX.IntrinsicElements[string];
    addCommand(node, {
        action: 'create',
        group: 'tag',
        parentId,
        beforeId,
        rootId: findRootId(node),
        id: node.instance,
        attrs: transformAttrCallbacks(node.props),
        tag: node.type,
    });
    for (let i = 0; i < node.children.length; i++) {
        mountChild(node, i, node.instance, null);
    }
    if (node.type === 'select') {
        updateSelectValue(node);
    }
    if (props.withCommand !== undefined) {
        addCommand(node, {
            action: 'create',
            group: 'custom',
            parentId: node.instance,
            data: props.withCommand.data,
            name: props.withCommand.name,
        });
    }
    return node;
}

function mountChild(node: VDomNodeCreated | VArrayNodeCreated, i: number, parentId: ID, beforeId: ID | null) {
    (node as VNodeCreatedChildren).children[i] = mountVNode(node, norm(node.children[i]), parentId, beforeId);
}
