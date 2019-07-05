function updateArray(node: VArrayNodeCreated, oldNode: VArrayNode, parentId: ID): VArrayNode {
    beforeUpdate(node, oldNode);
    node.instance = oldNode.instance;
    const newList = node.children;
    const oldList = oldNode.children;
    const skipHead = updateHead(node, oldNode, parentId);
    const skipTail = updateTail(node, oldNode, skipHead, parentId);
    const newEnd = newList.length - skipTail;
    const oldEnd = oldList.length - skipTail;

    const newDiff = newEnd - skipHead;
    const oldDiff = oldEnd - skipHead;

    if (newDiff > 0 || oldDiff > 0) {
        const map: {[key: string]: number} = {};
        const oldUsed: (true | undefined)[] = Array(oldList.length);
        if (newDiff > 0 && oldDiff > 0) {
            for (let i = skipHead; i < oldEnd; i++) {
                const oldChild = oldList[i];
                map[oldChild.key!] = i;
            }
        }
        let beforeVNode = newEnd < node.children.length ? (node.children[newEnd] as VNode) : undefined;
        for (let i = newEnd - 1; i >= skipHead; i--) {
            const child = norm(node.children[i]);
            const oldChildIdx = map[child.key!];
            const beforeId = beforeVNode === undefined ? null : findChildVDom(beforeVNode).instance;
            if (oldChildIdx !== undefined && oldUsed[oldChildIdx] === undefined) {
                oldUsed[oldChildIdx] = true;
                const oldChild = oldList[oldChildIdx];
                beforeVNode = updateVNode(node, child, oldChild, parentId);
                moveChild(beforeVNode, beforeId);
            } else {
                beforeVNode = mountVNode(node, child, parentId, beforeId);
            }
            (node as VNodeCreatedChildren).children[i] = beforeVNode;
        }
        for (let i = skipHead; i < oldEnd; i++) {
            if (oldUsed[i] === undefined) {
                const oldChild = oldList[i];
                removeVNode(oldChild, true);
            }
        }
    }
    return afterUpdate(node);
}

function updateHead(node: VArrayNodeCreated, oldNode: VArrayNode, parentId: ID) {
    const max = node.children.length < oldNode.children.length ? node.children.length : oldNode.children.length;
    let start = 0;
    while (start < max) {
        const child = norm(node.children[start]);
        const oldChild = oldNode.children[start];
        if (child.key !== oldChild.key) break;
        updateChild(node, start, oldChild, parentId);
        start++;
    }
    return start;
}

function updateTail(node: VArrayNodeCreated, oldNode: VArrayNode, skipHead: number, parentId: ID) {
    let newEnd = node.children.length;
    let oldEnd = oldNode.children.length;
    while (newEnd > skipHead && oldEnd > skipHead) {
        const newI = newEnd - 1;
        const oldI = oldEnd - 1;
        const child = norm(node.children[newI]);
        const oldChild = oldNode.children[oldI];
        if (child.key !== oldChild.key) break;
        updateChild(node, newI, oldChild, parentId);
        newEnd--;
        oldEnd--;
    }
    return node.children.length - newEnd;
}

function moveChild(node: VNode, beforeId: ID | null): ID | null {
    assert(node.status === 'active');
    if (node.kind === DOM_KIND) {
        addCommand(node, {action: 'move', group: 'tag', tag: node.type, id: node.instance, beforeId});
        return node.instance;
    }
    if (node.kind === TEXT_KIND) {
        addCommand(node, {action: 'move', group: 'text', id: node.instance, beforeId});
        return node.instance;
    }
    if (node.kind === COMPONENT_KIND) {
        return moveChild(node.children, beforeId);
    }
    if (node.kind === ARRAY_KIND) {
        for (let i = node.children.length - 1; i >= 0; i--) {
            beforeId = moveChild(node.children[i], beforeId);
        }
        return beforeId;
    }
    if (node.kind === PORTAL_KIND) {
        return never();
    }
    return never(node);
}
