/// <reference path="../commands.d.ts" />

const domMap: Node[] = [];
const svgNS = 'http://www.w3.org/2000/svg';
const xlinkNS = 'http://www.w3.org/1999/xlink';
const domRoots = new Map<string, Map<Node, Node | null>>();

function isSvg(tag: string, node: Node) {
    return (
        tag === 'svg' ||
        (tag !== 'div' &&
            tag !== 'span' &&
            tag !== 'td' &&
            tag !== 'tr' &&
            tag !== 'li' &&
            tag !== 'h1' &&
            tag !== 'h2' &&
            tag !== 'h3' &&
            tag !== 'i' &&
            tag !== 'u' &&
            tag !== 'b' &&
            tag !== 'strong' &&
            tag !== 'em' &&
            tag !== 'img' &&
            node.namespaceURI === svgNS)
    );
}

function setNode(id: ID, node: Node) {
    if (domMap.length <= id) {
        for (let i = domMap.length; i <= id; i++) {
            domMap.push(undefined!);
        }
    }
    domMap[id] = node;
}

function renderCommands(commands: Command[]) {
    for (let i = 0; i < commands.length; i++) {
        renderCommand(commands[i]);
    }
}

function startHydrate(id: RootId) {
    domRoots.set(id, new Map());
}

function endHydrate(id: RootId) {
    const map = domRoots.get(id)!;
    for (const [parentNode, nextNode] of map) {
        let n = nextNode;
        while (n !== null) {
            parentNode.removeChild(n);
            n = n.nextSibling;
        }
    }
    domRoots.delete(id);
}

function createDom(command: CreateDomCommand) {
    const parentNode = getParentNode(command.parentId);
    const nodeIsSVG = isSvg(command.tag, parentNode);
    let node;
    let beforeNode = getBeforeNode(command.beforeId);
    const hydratingMap = domRoots.get(command.rootId);
    if (hydratingMap !== undefined) {
        let nextNode = hydratingMap.get(parentNode);
        if (nextNode === undefined) {
            nextNode = parentNode.firstChild;
            hydratingMap.set(parentNode, nextNode);
        }
        if (nextNode !== null) {
            if (isComment(nextNode) && nextNode.nodeValue === 'n') {
                hydratingMap.set(parentNode, nextNode.nextSibling);
            } else if (isHTMLElement(nextNode) && nextNode.localName === command.tag) {
                node = nextNode;
                hydratingMap.set(parentNode, nextNode.nextSibling);
                const diff = createAttrsDiff(node, command.attrs, command.tag);
                setAttrs(node, diff, command.tag);
            }
        }
        if (node === undefined) {
            beforeNode = nextNode;
        }
    }
    if (node === undefined) {
        node = nodeIsSVG
            ? ((document.createElementNS(svgNS, command.tag) as Node) as HTMLElement)
            : document.createElement(command.tag);
        parentNode.insertBefore(node, beforeNode);
        if (hydratingMap !== undefined) {
            hydratingMap.set(node, null);
        }
        setAttrs(node, command.attrs, command.tag);
    }
    setNode(command.id, node);
}

function createText(command: CreateTextCommand) {
    let node;
    let beforeNode = getBeforeNode(command.beforeId);
    const parentNode = getParentNode(command.parentId);
    const hydratingMap = domRoots.get(command.rootId);
    if (hydratingMap !== undefined) {
        let nextNode = hydratingMap.get(parentNode);
        if (nextNode === undefined) {
            nextNode = parentNode.firstChild;
            hydratingMap.set(parentNode, nextNode);
        }
        if (nextNode !== null) {
            if (nextNode.nodeType === 8 && nextNode.nodeValue === 'n') {
                hydratingMap.set(parentNode, nextNode.nextSibling);
            } else if (isTextNode(nextNode)) {
                if (nextNode.nodeValue !== command.text) {
                    nextNode.nodeValue = command.text;
                }
                node = nextNode;
                const nextNextNode = node.nextSibling;
                if (nextNextNode !== null && nextNextNode.nodeType === 8 && nextNextNode.nodeValue === '') {
                    hydratingMap.set(parentNode, nextNextNode.nextSibling);
                } else {
                    hydratingMap.set(parentNode, nextNextNode);
                }
            }
        }
        if (node === undefined) {
            beforeNode = nextNode;
        }
    }
    if (node === undefined) {
        node = document.createTextNode(command.text);
        getParentNode(command.parentId).insertBefore(node, beforeNode);
    }
    setNode(command.id, node);
}

function renderCommand(command: Command) {
    switch (command.type) {
        case 'createDom': {
            createDom(command);
            break;
        }
        case 'createText': {
            createText(command);
            break;
        }
        case 'moveDom': {
            const node = domMap[command.id];
            const beforeNode = command.beforeId === null ? null : domMap[command.beforeId];
            node.parentNode!.insertBefore(node, beforeNode);
            break;
        }
        case 'updateDom': {
            const node = domMap[command.id] as HTMLElement;
            setAttrs(node, command.attrs, command.tag);
            break;
        }
        case 'setText': {
            const node = domMap[command.id];
            node.nodeValue = command.text;
            break;
        }
        case 'removeNode': {
            const node = domMap[command.id];
            node.parentNode!.removeChild(node);
            domMap[command.id] = undefined!;
            break;
        }
        case 'mountStart': {
            startHydrate(command.rootId);
            break;
        }
        case 'mountEnd': {
            endHydrate(command.rootId);
            break;
        }
        default: {
            never(command);
        }
    }
}

function getParentNode(id: string | ID) {
    return typeof id === 'string' ? document.querySelector(id)! : domMap[id];
}
function getBeforeNode(id: ID | null) {
    return id === null ? null : domMap[id];
}

function never(val: never): never {
    throw new Error('Never possible: ' + val);
}

function isComment(node: Node): node is Comment {
    return node.nodeType === 8;
}
function isHTMLElement(node: Node): node is HTMLElement {
    return node.nodeType === 1;
}
function isTextNode(node: Node): node is Text {
    return node.nodeType === 3;
}
