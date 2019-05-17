function createVTextNode(text: string): VTextNode {
    return {
        id: genId(),
        children: text,
        key: undefined,
        kind: textKind,
        props: undefined,
        type: undefined,
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
    };
}

function createComponentVNode(
    type: ComponentFun,
    props: object | null,
    key: string | undefined,
    children: Return[],
): VComponentNode {
    let componentProps;
    if (props === null) {
        componentProps = {children};
    } else {
        componentProps = props;
        (componentProps as {children: Return}).children = children;
    }
    return {
        id: undefined!,
        children: undefined!,
        key: key,
        kind: componentKind,
        props: componentProps,
        type: type,
    };
}
