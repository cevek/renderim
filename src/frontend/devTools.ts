declare const __REACT_DEVTOOLS_GLOBAL_HOOK__: {inject(bridge: {}): void};

function initDevTools() {
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
        return () => {};
    }
    const roots: {[key: string]: DevToolsNode} = {};
    // FRGlobal.roots.map((root, i) => {
    //     var instance = getInstance(root, true);
    //     roots[instance._id] = getInstance(root, true);
    // });
    const devToolsNodes = new Map<number, DevToolsNode>();
    const bridge = {
        ComponentTree: {
            getNodeFromInstance(instance: DevToolsNode) {
                return getNode(instance._id as ID);
            },
            getClosestInstanceFromNode(node: Node) {
                // todo:
                return;
            },
        },
        Mount: {
            _instancesByReactRootID: roots,
            _renderNewRootComponent(instance: DevToolsNode) {
                return instance;
            },
        },
        Reconciler: {
            mountComponent(instance: DevToolsNode) {},
            performUpdateIfNecessary(instance: DevToolsNode) {},
            receiveComponent(instance: DevToolsNode) {},
            unmountComponent(instance: DevToolsNode) {},
        },
    };
    __REACT_DEVTOOLS_GLOBAL_HOOK__.inject(bridge);

    function update(instance: DevToolsNode) {
        const exists = devToolsNodes.get(instance._id);
        if (exists !== undefined) {
            exists._stringText = instance._stringText;
            exists._currentElement = instance._currentElement;
            exists._renderedChildren = instance._renderedChildren.map(update);
            bridge.Reconciler.receiveComponent(exists);
            return exists;
        }
        bridge.Reconciler.mountComponent(instance);
        return instance;
    }

    return (command: DevtoolsCommand) => {
        update(command.node);
        if (command.action === 'update') {
            if (command.isRoot) {
                roots[command.node._id] = command.node;
                bridge.Mount._renderNewRootComponent(command.node);
            }
        }
        // else if (command.action === 'rootUnmount') {
        //     delete roots[command.node._id];
        // }
        for (const unmounted of command.unmounted) {
            bridge.Reconciler.unmountComponent(devToolsNodes.get(unmounted)!);
        }
    };
}
