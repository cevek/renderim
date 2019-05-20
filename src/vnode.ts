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
    };
}

function createDomVNode(type: string, props: object | null, key: string | undefined, children: Return[]): VDomNode {
    return {
        _id: _id++,
        status: 'created',
        id: genId(),
        children: children,
        key: key,
        kind: domKind,
        props: createPropsFromObj(props),
        type: type,
        extra: undefined,
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
            commands: [],
            errors: [],
        };
        extra = val;
    }
    if (type === Suspense) {
        const val: SuspenseExtra = {
            timeoutAt: 0,
            commands: [],
            components: [],
            promises: [],
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
        suspense: undefined!,
        errorBoundary: undefined!,
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

function staleOldVNodeDeep(node: VNode): void {
    visitEachNode(node, n => {
        assert(n.status === 'active');
        n.status = 'stalled';
        staleNodes.add(node);
    });
}
function validateStatusDeep(node: VNode, status: VNodeStatus): void {
    visitEachNode(node, n => {
        assert(n.status === status);
    });
}
