function createVTextNode(text: string): VTextNode {
    return {
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
    return {
        id: undefined!,
        children: undefined!,
        key: key,
        kind: componentKind,
        props,
        type: type as ComponentFun,
        extra: undefined,
    };
}
