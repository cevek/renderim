function updateArray(node: VArrayNodeCreated, oldNode: VArrayNode, parentId: ID): VArrayNode {
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
            const beforeId = beforeVNode === undefined ? null : findChildVDom(beforeVNode).id;
            if (oldChildIdx !== undefined && oldUsed[oldChildIdx] === undefined) {
                oldUsed[oldChildIdx] = true;
                const oldChild = oldList[oldChildIdx];
                beforeVNode = updateVNode(norm(node.children[i]), oldChild, parentId);
                moveChild(child, beforeId);
            } else {
                beforeVNode = mountVNode(child, parentId, beforeId);
            }
            node.children[i] = beforeVNode;
        }
        for (let i = skipHead; i < oldEnd; i++) {
            if (oldUsed[i] === undefined) {
                const oldChild = oldList[i];
                removeVNode(oldChild, true);
            }
        }
    }
    finalUpdate(node, oldNode);
    return node as VArrayNode;
}

function updateHead(node: VArrayNodeCreated, oldNode: VArrayNode, parentId: ID) {
    const max = node.children.length < oldNode.children.length ? node.children.length : oldNode.children.length;
    let start = 0;
    while (start < max) {
        const child = norm(node.children[start]);
        const oldChild = oldNode.children[start];
        if (child.key !== oldChild.key) break;
        node.children[start] = updateVNode(norm(node.children[start]), oldChild, parentId);
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
        node.children[newI] = updateVNode(norm(node.children[newI]), oldChild, parentId);
        newEnd--;
        oldEnd--;
    }
    return node.children.length - newEnd;
}

function moveChild(node: VNodeCreated, beforeId: ID | null): ID | null {
    if (node.kind === domKind) {
        addCommand(node, {action: 'move', group: 'tag', tag: node.type, id: node.id, beforeId});
        return node.id;
    }
    if (node.kind === textKind) {
        addCommand(node, {action: 'move', group: 'text', id: node.id, beforeId});
        return node.id;
    }
    if (node.kind === componentKind) {
        return moveChild(norm(node.children), beforeId);
    }
    if (node.kind === arrayKind) {
        for (let i = node.children.length - 1; i >= 0; i--) {
            const child = norm(node.children[i]);
            beforeId = moveChild(child, beforeId);
        }
        return beforeId;
    }
    if (node.kind === portalKind) {
        return never();
    }
    return never(node);
}

