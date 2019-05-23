function createContext<T>(defaultValue: T) {
    function ContextProvider(props: {value: T; children: Return}) {
        return props.children;
    }
    return {
        Provider: ContextProvider,
        Consumer: function ContextConsumer(props: {children: (value: T) => Return}) {
            let vnode = currentComponent.parentComponent;
            while (vnode !== undefined) {
                if (vnode.type === ContextProvider) {
                    const value = (vnode.props as {value: T}).value;
                    return props.children(value);
                }
                vnode = vnode.parentComponent;
            }
            return props.children(defaultValue);
        },
    };
}
