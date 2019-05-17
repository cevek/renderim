/// <reference path="../commands.d.ts" />

const nodeMap: Node[] = [];
function setNode(id: ID, node: Node) {
    if (nodeMap.length <= id) {
        for (let i = nodeMap.length; i <= id; i++) nodeMap.push(undefined!);
    }
    nodeMap[id] = node;
}

function renderCommands(commands: Command[]) {
    for (let i = 0; i < commands.length; i++) {
        renderCommand(commands[i]);
    }
}

function renderCommand(command: Command) {
    switch (command.type) {
        case 'createDom':
        case 'createDomWithText': {
            const node = document.createElement(command.tag);
            setNode(command.id, node);
            insert(node, command.parentId, command.beforeId);
            for (let i = 0; i < command.props.length; i += 2) {
                const prop = command.props[i] as string;
                const value = command.props[i + 1];
                node.setAttribute(prop, String(value));
            }
            if (command.type === 'createDomWithText') {
                node.textContent = command.text;
                const textNode = node.firstChild!;
                setNode(command.textId, textNode);
            }
            break;
        }
        case 'createText': {
            const node = document.createTextNode(command.text);
            setNode(command.id, node);
            insert(node, command.parentId, command.beforeId);
            break;
        }
        case 'moveDom': {
            const node = nodeMap[command.id];
            const beforeNode = command.beforeId === null ? null : nodeMap[command.beforeId];
            node.parentNode!.insertBefore(node, beforeNode);
            break;
        }
        case 'updateDom': {
            const node = nodeMap[command.id] as Element;
            for (let i = 0; i < command.props.length; i += 2) {
                const prop = command.props[i] as string;
                const value = command.props[i + 1];
                if (value === null) {
                    node.removeAttribute(prop);
                } else {
                    node.setAttribute(prop, value);
                }
            }
            break;
        }
        case 'setText': {
            const node = nodeMap[command.id];
            node.nodeValue = command.text;
            break;
        }
        case 'removeDom': {
            const node = nodeMap[command.id];
            node.parentNode!.removeChild(node);
            nodeMap[command.id] = undefined!;
            break;
        }
        case 'removeText': {
            const node = nodeMap[command.id];
            node.parentNode!.removeChild(node);
            nodeMap[command.id] = undefined!;
            break;
        }
        default: {
            never(command);
        }
    }

    function insert(node: Node, parentId: string | ID, beforeId: ID | null) {
        const parentNode = typeof parentId === 'string' ? document.getElementById(parentId)! : nodeMap[parentId];
        const beforeNode = beforeId === null ? null : nodeMap[beforeId];
        parentNode.insertBefore(node, beforeNode);
    }
}

function never(val: never): never {
    throw new Error('Never possible: ' + val);
}
