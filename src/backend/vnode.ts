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

function createDomVNode(type: string, attrs: Attrs, key: string | undefined, children: VInput[]): VDomNodeCreated {
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
    type: (props: Props) => VInput,
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

function createVArrayNode(arr: VInput[]): VArrayNodeCreated {
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
function createVPortalNode(type: ID, children: VInput): VPortalNodeCreated {
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

function norm(value: VInput): VNodeCreated {
    if (value === null || value === undefined) {
        return createVTextNode('');
    }
    if (Array.isArray(value)) {
        return createVArrayNode(value);
    }
    if (isVNode(value)) {
        if (value.status === 'cancelled') {
            return cloneVNode(value);
        }
        assert(value.status === 'created' || value.status === 'active');
        return value;
    } else if (isObj(value)) {
        console.warn('objects are not allowed as children', value);
    }
    if (typeof value === 'string' || typeof value === 'number') {
        return createVTextNode(String(value));
    }
    return createVTextNode('');
}

function isVNode(value: VInput): value is VNodeCreated {
    return isObj<{kind?: {parent?: {}}}>(value) && isObj(value.kind) && value.kind.parent === kindParent;
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

function ensureVDomNode(node: VInput) {
    if (!isVNode(node) || node.kind !== domKind) throw new AssertError('Children must be a tag element');
    return node;
}
