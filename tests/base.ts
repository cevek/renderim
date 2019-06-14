/// <reference path="../src/backend/export.d.ts" />
import {setHook, render as Render} from 'renderim';
self.postMessage = () => {};

setHook('beforeComponent', () => {});
setHook('afterComponent', () => {});

const queue: JSX.Element[] = [];
setHook('restartComponent', node => {
    queue.push(node);
});

export function getNextRestartedComponent() {
    const el = queue.shift();
    if (el === undefined) throw new Error('No next restarted component');
    return treeToString(makeTree(el));
}

type Item = {type: string; props: object; children: (Item | string)[]};
function makeTree(node: JSX.Element): Item | string {
    let type;
    if (typeof node === 'boolean' || node === null || node === undefined) return '';
    if (typeof node === 'number' || typeof node === 'string') return node;
    if (typeof node.type === 'string') {
        type = node.type;
    } else if (typeof node.type === 'function') {
        type = node.type.name;
    } else if (Array.isArray(node.children)) {
        return (node.children.map(makeTree) as {}) as Item;
    } else {
        return String(node.children);
    }
    const children = Array.isArray(node.children) ? node.children.map(makeTree) : [makeTree(node.children!)];
    return {
        type,
        props: {},
        children: children.flat(1000).filter(item => (typeof item === 'string' ? item !== '' : true)),
    };
}

function treeToString(item: Item | string, level = 0): string {
    const ident = '   '.repeat(level);
    if (typeof item === 'string') return `${ident}${item}`;
    const children = item.children.map(child => treeToString(child, level + 1));
    if (children.length === 0) return `${ident}<${item.type}/>`;
    return `${ident}<${item.type}>\n${children.join('\n')}\n${ident}</${item.type}>`;
}

export function render(node: JSX.Element) {
    const tree = makeTree(Render(node, '#root'));
    return treeToString(tree);
}

export function createLoadData() {
    let data: Promise<unknown> | string;
    return function Data({ms}: {ms: number}) {
        if (data === undefined) {
            data = new Promise(res => {
                return setTimeout(() => {
                    data = 'data';
                    res();
                }, ms);
            });
        }
        if (data instanceof Promise) throw data;
        return (data as {}) as JSX.Element;
    };
}
