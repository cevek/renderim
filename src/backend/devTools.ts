// const devToolsNodes = new Map<number, DevToolsNode>();

// let devToolsId = 0;

let convertVNodeToDevToolsJSON = (node: VNode): DevToolsNode => undefined!;
if (process.env.NODE_ENV === 'development') {
    function convertProps(props: unknown): unknown {
        type Hash = {[key: string]: Hash | string};
        if (isVNode(props as VNode)) return 'VNode';
        if (isObj<Hash>(props)) {
            const newObj: Hash = {};
            if (Array.isArray(props)) return props.map(convertProps);
            for (const prop in props) {
                const value = props[prop];
                try {
                    // could be maximum callstack
                    newObj[prop] = convertProps(value) as Hash;
                } catch (err) {
                    console.warn(err);
                }
            }
            return newObj;
        }
        if (typeof props === 'function') return `${props.name === '' ? '() => {...}' : `#${props.name}`}` as {};
        return props;
    };
    convertVNodeToDevToolsJSON = function convertVNodeToDevToolsJSON(node: VNode): DevToolsNode {
        let stringText;
        let children: DevToolsNode[] = [];
        let currentElement;
        const renderedComponent = undefined;
        if (node.kind === componentKind) {
            currentElement = {type: node.type.name, props: convertProps(node.props)};
            children = [convertVNodeToDevToolsJSON(node.children)];
        } else if (node.kind === domKind) {
            currentElement = {type: node.type, props: convertProps(node.props)};
            children = node.children.map(convertVNodeToDevToolsJSON);
        } else if (node.kind === arrayKind) {
            currentElement = {type: '#array', props: {}};
            children = node.children.map(convertVNodeToDevToolsJSON);
        } else if (node.kind === portalKind) {
            currentElement = {type: '#portal', props: {container: node.type}};
            children = [convertVNodeToDevToolsJSON(node.children)];
        } else if (node.kind === textKind) {
            currentElement = String(node.children);
            stringText = String(node.children);
        } else {
            return never(node);
        }
        const id = getPersistId(node);
        return {
            _id: id,
            _nodeId: findChildVDom(node).id,
            _stringText: stringText,
            _instance: undefined,
            _currentElement: currentElement,
            _renderedChildren: children,
            _inDevTools: true,
            _renderedComponent: renderedComponent,
        };
    };
}
