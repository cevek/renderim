function updateAttrs(attrs: Attrs, oldAttrs: Attrs): Attrs | undefined {
    const diff: {[key: string]: unknown} = {};
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
                } else if (typeof value === 'function' || typeof oldValue === 'function') {
                    const newRPCCallback = typeof value === 'function' ? transformCallback(value) : undefined;
                    const oldRPCCallback = typeof oldValue === 'function' ? transformCallback(oldValue) : undefined;
                    const listener: DomListener = {
                        newListener: newRPCCallback && newRPCCallback,
                        oldListener: oldRPCCallback && oldRPCCallback,
                    };
                    diff[attr] = listener;
                    hasChanges = true;
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

function transformAttrCallbacks(attrs: Attrs): Attrs {
    let newAttrs;
    for (const attr in attrs) {
        const value = attrs[attr];
        if (typeof value === 'function') {
            const command = transformCallback(value);
            const listener: DomListener = {newListener: command};
            if (newAttrs === undefined) newAttrs = {...attrs};
            newAttrs[attr] = listener;
        }
    }
    return newAttrs === undefined ? attrs : newAttrs;
}

function withPreventDefault(cb: () => void) {
    return setDataToCallback(cb as (arg: unknown) => void, [{preventDefault: {__args: []}}]);
}
function withStopProgation(cb: () => void) {
    return setDataToCallback(cb as (arg: unknown) => void, [{stopPropagation: {__args: []}}]);
}
function withTargetValue(cb: (value: string) => void) {
    const newCb = (event: {target: {value: string}}) => cb(event.target.value);
    return setDataToCallback(newCb, [{target: {value: ''}}]);
}
function withTargetChecked(cb: (checked: boolean) => void) {
    const newCb = (event: {target: {checked: boolean}}) => cb(event.target.checked);
    return setDataToCallback(newCb, [{target: {checked: true}}]);
}

function withEventData<T extends object>(cb: (value: T) => void, shape: T) {
    return setDataToCallback(cb, [shape]);
}
