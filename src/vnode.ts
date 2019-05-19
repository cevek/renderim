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
            canShow: false,
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
