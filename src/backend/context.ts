function createContext<T>(defaultValue: T) {
    function ContextProvider(props: {value: T; children: VInput}) {
        return props.children;
    }
    return {
        Provider: ContextProvider,
        Consumer: function ContextConsumer(props: {children: (value: T) => VInput}) {
            let n = currentComponent.parentComponent;
            while (typeof n !== 'string') {
                if (n.type === ContextProvider) {
                    const value = (n.props as {value: T}).value;
                    return props.children(value);
                }
                n = n.parentComponent;
            }
            return props.children(defaultValue);
        },
    };
}
