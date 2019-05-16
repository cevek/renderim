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
        let found = false;
        for (let j = 0; j < oldProps.length; j += 2) {
            if (oldProps[j] === prop) {
                foundOldProps++;
                if (oldProps[j + 1] !== value) {
                    diff.push(prop, value);
                }
                found = true;
                break;
            }
        }
        if (!found) {
            diff.push(prop, value);
        }
    }
    if (foundOldProps * 2 !== oldProps.length) {
        for (let i = 0; i < oldProps.length; i += 2) {
            const oldProp = oldProps[i];
            let found = false;
            for (let j = 0; j < props.length; j += 2) {
                if (oldProp === props[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                diff.push(oldProp, null);
            }
        }
    }
    return diff;
}

function createPropsFromObj(props: object | undefined) {
    const arr: string[] = [];
    if (props === undefined) return arr;
    for (const prop in props) {
        const value = props[prop as never];
        arr.push(prop, value);
    }
    return arr;
}
