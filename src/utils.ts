function never(val?: never): never {
    throw new Error('Never possible: ' + val);
}

function genId() {
    return (id++ as unknown) as ID;
}

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

function norm(node: Return): VNode {
    if (node === null || node === undefined) {
        return createVTextNode('');
    }
    if (Array.isArray(node)) {
        const arrayVNode: VArrayNode = {
            kind: arrayKind,
            id: undefined!,
            children: node,
            key: undefined,
            props: undefined,
            type: undefined,
        };
        return arrayVNode;
    }
    if (typeof node === 'object' && ((node as VNode).kind as unknown) instanceof Kind) {
        return node as VNode;
    }
    if (typeof node === 'string' || typeof node === 'number') {
        return createVTextNode(String(node));
    }
    return createVTextNode('');
}

function findChildVDom(node: VNode): VDomNode | VTextNode {
    if (node.kind === domKind || node.kind === textKind) return node;
    if (node.kind === componentKind) return findChildVDom(node.children);
    if (node.kind === arrayKind) return findChildVDom(node.children[0] as VNode);
    if (node.kind === portalKind) return findChildVDom(node.children[0] as VNode);
    return never();
}
