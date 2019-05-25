function createVTextNode(text: string): VTextNodeCreated {
    return {
        _id: _id++,
        status: 'created',
        id: genId(),
        children: text,
        key: undefined,
        kind: textKind,
        props: undefined,
        type: undefined,
        extra: undefined,
        parentComponent: undefined!,
    };
}

function createDomVNode(type: string, attrs: Attrs, key: string | undefined, children: Return[]): VDomNodeCreated {
    return {
        _id: _id++,
        status: 'created',
        id: genId(),
        children: children,
        key: key,
        kind: domKind,
        props: attrs,
        type: type,
        extra: undefined,
        parentComponent: undefined!,
    };
}

function createComponentVNode<Props extends object>(
    type: (props: Props) => Return,
    props: Props,
    key?: string,
): VComponentNodeCreated {
    let extra = undefined;
    if (type === ErrorBoundary) {
        const val: ErrorBoundaryExtra = {
            errors: [],
        };
        extra = val;
    }
    if (type === Suspense) {
        const val: SuspenseExtra = {
            timeoutAt: 0,
            components: [],
            promises: [],
            resolvedPromises: 0,
        };
        extra = val;
    }
    return {
        _id: _id++,
        status: 'created',
        id: undefined!,
        children: undefined!,
        key: key,
        kind: componentKind,
        props,
        type: type as ComponentFun,
        extra: extra,
        parentComponent: undefined!,
    };
}


function createVArrayNode(arr: Return[]): VArrayNodeCreated {
    return {
        _id: _id++,
        status: 'created',
        kind: arrayKind,
        id: undefined!,
        children: arr,
        key: undefined,
        props: undefined,
        type: undefined,
        extra: undefined,
        parentComponent: undefined!,
    };
}
function createVPortalNode(type: ID, children: Return): VPortalNodeCreated {
    return {
        _id: _id++,
        status: 'created',
        kind: portalKind,
        id: undefined,
        children: children,
        key: undefined,
        props: undefined,
        type: type,
        extra: undefined,
        parentComponent: undefined!,
    };
}

function norm(node: Return): VNodeCreated {
    if (node === null || node === undefined) {
        return createVTextNode('');
    }
    if (Array.isArray(node)) {
        return createVArrayNode(node);
    }
    if (typeof node === 'object' && ((node as VNode).kind as unknown) instanceof Kind) {
        const vnode = node as VNode | VNodeCreated;
        if (vnode.status === 'cancelled') {
            return cloneVNode(vnode);
        }
        assert(vnode.status === 'created' || vnode.status === 'active');
        return vnode as VNodeCreated;
    }
    if (typeof node === 'string' || typeof node === 'number') {
        return createVTextNode(String(node));
    }
    return createVTextNode('');
}

function cloneVNode(node: VNodeCreated): VNodeCreated {
    if (node.kind === componentKind) {
        return createComponentVNode(node.type, node.props, node.key);
    }
    if (node.kind === domKind) {
        return createDomVNode(node.type, node.props, node.key, node.children.map(node => cloneVNode(norm(node))));
    }
    if (node.kind === arrayKind) {
        return createVArrayNode(node.children.map(node => cloneVNode(norm(node))));
    }
    if (node.kind === portalKind) {
        return createVPortalNode(node.type, cloneVNode(norm(node.children)));
    }
    if (node.kind === textKind) {
        return createVTextNode(node.children);
    }
    return never(node);
}
