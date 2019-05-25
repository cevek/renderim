function createStylesDiff(node: HTMLElement, styles: Styles) {
    const domStylesNames = [...node.style];
    const domStyle = node.style;
    const diff: Styles = {};
    for (const styleName in styles) {
        const pos = domStylesNames.indexOf(styleName);
        if (pos === -1) {
            diff[styleName] = styles[styleName];
        } else {
            domStylesNames[pos] = undefined!;
            if (String(styles[styleName]) !== domStyle[styleName as never]) {
                diff[styleName] = styles[styleName];
            }
        }
    }
    for (const domStyleName of domStylesNames) {
        if (domStyleName !== undefined) {
            diff[domStyleName] = '';
        }
    }
    return diff;
}

function createAttrsDiff(node: HTMLElement, attrs: Attrs, tagName: string) {
    const domAttrs = [...node.attributes].map(attr => attr.nodeName);
    const diff: Attrs = {};
    for (const attrName in attrs) {
        const attrValue = attrs[attrName];
        const pos = domAttrs.indexOf(attrName);
        if (pos > -1) {
            domAttrs[pos] = undefined!;
            if (attrName === 'style') {
                const styleDiff = createStylesDiff(node, attrValue as Styles);
                diff[attrName] = styleDiff;
            } else if (
                attrName === 'value' &&
                (tagName === 'select' || tagName === 'textarea') &&
                String(attrValue) === (node as HTMLSelectElement).value
            ) {
            } else {
                if (node.getAttribute(attrName) !== String(attrValue)) {
                    diff[attrName] = attrValue;
                }
            }
        } else {
            diff[attrName] = attrValue;
        }
    }
    for (const attr of domAttrs) {
        if (attr === undefined) {
            diff[attr] = null;
        }
    }
    return diff;
}

function eventCallback(event: Event) {
    
}

function attrIsEvent(attr: string) {
    return attr.length > 2 && attr[0] === 'o' && attr[1] === 'n';
}

function setAttrs(node: HTMLElement, attrs: Attrs, tagName: string) {
    for (const attr in attrs) {
        const value = attrs[attr];
        if (value === null || value === false) {
            if (attrIsEvent(attr)) {
                node.removeEventListener(attr.substr(2), eventCallback);
            } else if (attr === 'xlinkHref') {
                node.removeAttributeNS(xlinkNS, 'xlink:href');
            } else {
                node.removeAttribute(attr);
            }
        } else if (attr === 'style') {
            setStyles(node, value as Styles);
        } else if (attr === 'xlinkHref') {
            node.setAttributeNS(xlinkNS, 'xlink:href', value as string);
        } else if (attrIsEvent(attr)) {
            node.addEventListener(attr.substr(2), eventCallback, {passive: true});
        } else {
            if (attr === 'value') {
                if (tagName === 'select' || tagName === 'textarea') {
                    (node as HTMLInputElement).value = value as string;
                    continue;
                }
            }
            node.setAttribute(attr, value === true ? '' : (value as string));
        }
    }
}

function setStyles(node: HTMLElement, styles: Styles) {
    const domStyle = node.style;
    for (const styleName in styles) {
        const value = styles[styleName];
        if (value === '') {
            domStyle[styleName as never] = '';
        }
    }
    for (const styleName in styles) {
        const value = styles[styleName];
        if (value !== '') {
            domStyle[styleName as never] = value;
        }
    }
}
