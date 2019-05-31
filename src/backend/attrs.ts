function updateAttrs(attrs: Attrs, oldAttrs: Attrs) {
    const diff: Attrs = {};
    let hasChanges = false;
    const oldAttrArr = Object.keys(oldAttrs);
    for (const attr in attrs) {
        const value = attrs[attr];
        const oldPos = oldAttrArr.indexOf(attr);
        if (oldPos === -1) {
            diff[attr] = value;
            hasChanges = true;
        } else {
            oldAttrArr[oldPos] = undefined!;
            const oldValue = oldAttrs[attr];
            if (oldValue !== value) {
                if (attr === 'style') {
                    const diffStyle = diffStyles(value as Styles, oldValue as Styles);
                    if (diffStyle !== undefined) {
                        diff[attr] = diffStyle;
                        hasChanges = true;
                    }
                } else {
                    diff[attr] = value;
                    hasChanges = true;
                }
            }
        }
    }
    for (const oldAttr of oldAttrArr) {
        if (oldAttr !== undefined) {
            diff[oldAttr] = null;
            hasChanges = true;
        }
    }
    return hasChanges ? diff : undefined;
}

function diffStyles(styles: Styles, oldStyles: Styles) {
    let hasChanges = false;
    const diff: Styles = {};
    styles = ensureObject(styles);
    oldStyles = ensureObject(oldStyles);
    const oldKeys = Object.keys(oldStyles);
    for (const key in styles) {
        const value = styles[key];
        const oldPos = oldKeys.indexOf(key);
        if (oldPos === -1) {
            diff[key] = value;
            hasChanges = true;
        } else {
            oldKeys[oldPos] = undefined!;
            if (oldStyles[key] !== styles[key]) {
                diff[key] = value;
                hasChanges = true;
            }
        }
    }
    for (const oldKey of oldKeys) {
        if (oldKey !== undefined) {
            diff[oldKey] = '';
            hasChanges = true;
        }
    }
    return hasChanges ? diff : undefined;
}

function updateSelectValue(node: VDomNodeCreated) {
    addCommand(node, {
        action: 'update',
        group: 'tag',
        id: node.id,
        attrs: {value: node.props.value},
        tag: node.type,
    });
}

function transformAttrCallbacks(attrs: Attrs) {
    for (const attr in attrs) {
        const value = attrs[attr];
        if (typeof value === 'function') {
            attrs[attr] = transformCallback(value as () => void, () => {}, []);
        }
    }
    return attrs;
}
