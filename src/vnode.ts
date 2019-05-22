function createVTextNode(text: string): VTextNode {
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
        errorBoundary: undefined!,
        suspense: undefined!,
    };
}

function createDomVNode(type: string, props: string[], key: string | undefined, children: Return[]): VDomNode {
    return {
        _id: _id++,
        status: 'created',
        id: genId(),
        children: children,
        key: key,
        kind: domKind,
        props: props,
        type: type,
        extra: undefined,
        errorBoundary: undefined!,
        suspense: undefined!,
    };
}

function createComponentVNode<Props extends object>(
    type: (props: Props) => Return,
    props: Props,
    key?: string,
): VComponentNode {
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
        errorBoundary: undefined!,
        suspense: undefined!,
    };
}

function visitEachNode(node: VNode, cb: (node: VNode) => void): void {
    cb(node);
    if (node.kind === componentKind) {
        return visitEachNode(node.children, cb);
    }
    if (node.kind === domKind) {
        for (const child of node.children) {
            visitEachNode(child as VNode, cb);
        }
        return;
    }
    if (node.kind === arrayKind) {
        for (const child of node.children) {
            visitEachNode(child as VNode, cb);
        }
        return;
    }
    if (node.kind === portalKind) {
        for (const child of node.children) {
            visitEachNode(child as VNode, cb);
        }
        return;
    }
    if (node.kind === textKind) {
        return;
    }
    return never(node);
}

function createVArrayNode(arr: Return[]): VArrayNode {
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
        errorBoundary: undefined!,
        suspense: undefined!,
    };
}
function createVPortalNode(arr: Return[]): VPortalNode {
    throw new Error('Unimplemeted');
}

function norm(node: Return): VNode {
    if (node === null || node === undefined) {
        return createVTextNode('');
    }
    if (Array.isArray(node)) {
        return createVArrayNode(node);
    }
    if (typeof node === 'object' && ((node as VNode).kind as unknown) instanceof Kind) {
        const vnode = node as VNode;
        if (vnode.status === 'cancelled') {
            return cloneVNode(vnode);
        }
        assert(vnode.status === 'created' || vnode.status === 'active');
        return vnode;
    }
    if (typeof node === 'string' || typeof node === 'number') {
        return createVTextNode(String(node));
    }
    return createVTextNode('');
}

function cloneVNode(node: VNode): VNode {
    if (node.kind === componentKind) {
        return createComponentVNode(node.type, node.props, node.key);
    }
    if (node.kind === domKind) {
        return createDomVNode(node.type, node.props, node.key, node.children.map(node => cloneVNode(node as VNode)));
    }
    if (node.kind === arrayKind) {
        return createVArrayNode(node.children.map(node => cloneVNode(node as VNode)));
    }
    if (node.kind === portalKind) {
        return createVPortalNode(node.children.map(node => cloneVNode(node as VNode)));
    }
    if (node.kind === textKind) {
        return createVTextNode(node.children);
    }
    return never(node);
}
