function createContext<T>(defaultValue: T) {
    function ContextProvider(props: {value: T; children: VElement}) {
        return props.children;
    }
    return {
        Provider: ContextProvider,
        Consumer: function ContextConsumer(props: {children: (value: T) => Return}): VElement {
            let n = currentComponent.parentComponent;
            while (typeof n !== 'string') {
                if (n.type === ContextProvider) {
                    const value = (n.props as {value: T}).value;
                    return props.children(value) as VElement;
                }
                n = n.parentComponent;
            }
            return props.children(defaultValue) as VElement;
        },
    };
}
