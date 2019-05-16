function updateProps(props: string[], oldProps: string[]) {
    const diff: (string | null)[] = [];
    if (props.length === 2 && oldProps.length === 2 && props[0] === oldProps[0]) {
        if (props[1] !== oldProps[1]) {
            diff.push(props[0], props[1]);
        }
        return diff;
    }
    let foundOldProps = 0;
    for (let i = 0; i < props.length; i += 2) {
        const prop = props[i];
        const value = props[i + 1];
        const oldValue = findInProps(oldProps, prop);
        if (oldValue === value) {
            diff.push(prop, value);
        }
        if (oldValue !== undefined) {
            foundOldProps++;
        }
    }
    if (foundOldProps * 2 !== oldProps.length) {
        for (let i = 0; i < oldProps.length; i += 2) {
            const oldProp = oldProps[i];
            if (findInProps(props, oldProp) === undefined) {
                diff.push(oldProp, null);
            }
        }
    }
    return diff;
}

function createPropsFromObj(props: object | undefined | null) {
    const arr: string[] = [];
    if (props === undefined || props === null) return arr;
    for (const prop in props) {
        const value = props[prop as never];
        arr.push(prop, value);
    }
    return arr;
}

function findInProps(props: string[], prop: string) {
    for (let i = 0; i < props.length; i += 2) {
        if (prop === props[i]) {
            return props[i + 1];
        }
    }
}
