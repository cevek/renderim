function updateProps(props: Props, oldProps: Props) {
    const diff = ([] as unknown) as Props;
    if (props.length === 2 && oldProps.length === 2 && props[0] === oldProps[0]) {
        if (props[1] !== oldProps[1]) {
            const key = props[0];
            diff.push(key, key === 'style' ? diffStyles(props[1], oldProps[1] as {[key: string]: string}) : props[1]);
        }
        return diff;
    }
    let foundOldProps = 0;
    for (let i = 0; i < props.length; i += 2) {
        const prop = props[i] as string;
        const value = props[i + 1] as string;
        const oldValue = findInProps(oldProps, prop) as string;
        if (oldValue !== value) {
            diff.push(prop, prop === 'style' ? diffStyles(value, oldValue) : value);
        }
        if (oldValue !== undefined) {
            foundOldProps++;
        }
    }
    if (foundOldProps * 2 !== oldProps.length) {
        for (let i = 0; i < oldProps.length; i += 2) {
            const oldProp = oldProps[i] as string;
            if (findInProps(props, oldProp) === undefined) {
                diff.push(oldProp, oldProp === 'style' ? diffStyles(null, oldProp) : null);
            }
        }
    }
    return diff;
}

function diffStyles(styles: Props[1], oldStyles: Props[1]) {
    const diff = {} as {[key: string]: string};
    if (typeof styles === 'string' || typeof oldStyles === 'string')
        throw new AssertError('Styles as string are not supported');
    if (styles !== undefined && styles !== null) {
        for (const key in styles) {
            const value = styles[key];
            if (oldStyles === undefined || oldStyles === null || oldStyles[key] !== styles[key]) {
                diff[key] = value;
            }
        }
    }
    if (oldStyles !== undefined && oldStyles !== null) {
        for (const key in oldStyles) {
            if (styles === null || styles === undefined || !(key in styles)) {
                diff[key] = '';
            }
        }
    }
    return diff;
}

function createPropsFromObj(props: object | undefined | null) {
    const arr = ([] as unknown) as Props;
    if (props === undefined || props === null) return arr;
    for (const prop in props) {
        const value = props[prop as never];
        arr.push(prop, value);
    }
    return arr;
}

function findInProps(props: Props, prop: string) {
    for (let i = 0; i < props.length; i += 2) {
        if (prop === props[i]) {
            return props[i + 1];
        }
    }
}
