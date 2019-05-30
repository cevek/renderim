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
    sendBack(mountNodes.map(({node, command}) => ({id: command.id, data: extractProps(node, command.extractArgs[0])})));
    mountNodes = [];
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

function createDom(command: CreateTagCommand) {
    const parentNode = getNode(command.parentId);
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
                setAttrs(node, command.id, diff, command.tag);
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
        setAttrs(node, command.id, command.attrs, command.tag);
    }
    setNode(command.id, node);
}

function createText(command: CreateTextCommand) {
    let node;
    let beforeNode = getBeforeNode(command.beforeId);
    const parentNode = getNode(command.parentId);
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
        getNode(command.parentId).insertBefore(node, beforeNode);
    }
    setNode(command.id, node);
}

function renderCommand(command: Command) {
    if (command.group === 'tag') {
        if (command.action === 'create') {
            createDom(command);
        } else if (command.action === 'move') {
            moveNode(command.id, command.beforeId);
        } else if (command.action === 'update') {
            setAttrs(getNode(command.id) as HTMLElement, command.id, command.attrs, command.tag);
        } else if (command.action === 'remove') {
            removeNode(command.id);
        } else {
            never(command);
        }
    } else if (command.group === 'text') {
        if (command.action === 'create') {
            createText(command);
        } else if (command.action === 'move') {
            moveNode(command.id, command.beforeId);
        } else if (command.action === 'update') {
            getNode(command.id).nodeValue = command.text;
        } else if (command.action === 'remove') {
            removeNode(command.id);
        } else {
            never(command);
        }
    } else if (command.group === 'mount') {
        if (command.action === 'start') {
            startHydrate(command.rootId);
        } else if (command.action === 'end') {
            endHydrate(command.rootId);
        } else {
            never(command);
        }
    } else if (command.group === 'script') {
        if (command.action === 'load') {
            const script = document.createElement('script');
            script.src = command.url;
            script.onload = transformArg(command.onLoadCallback) as () => void;
            script.onerror = transformArg(command.onErrorCallback) as () => void;
            document.head.appendChild(script);
        }
    } else if (command.group === 'style') {
        if (command.action === 'load') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = command.url;
            link.onload = transformArg(command.onLoadCallback) as () => void;
            link.onerror = transformArg(command.onErrorCallback) as () => void;
            document.head.appendChild(link);
        } else if (command.action === 'updateAll') {
            const links = document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
            for (const link of links) {
                updateLink(link);
            }
        }
    } else if (command.group === 'custom') {
    } else {
        never(command);
    }
}

function updateLink(link: HTMLLinkElement) {
    const newLink = link.cloneNode() as HTMLLinkElement;
    newLink.onload = () => link.remove();
    newLink.href = link.href.split('?')[0] + '?' + Date.now();
    link.parentNode.insertBefore(newLink, link.nextSibling);
}

function moveNode(id: ID, beforeId: ID | null) {
    const node = domMap[id];
    const beforeNode = beforeId === null ? null : domMap[beforeId];
    node.parentNode!.insertBefore(node, beforeNode);
}
function removeNode(id: ID) {
    const node = domMap[id];
    node.parentNode!.removeChild(node);
    domMap[id] = undefined!;
}

function getNode(id: string | ID) {
    if (typeof id === 'object' && id !== null) return (window as unknown) as Node;
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
