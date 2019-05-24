type Styles = {[key: string]: string};
type DomAttr = {
    name: string;
    value: string | null;
    used: boolean;
};
function createDiffFromStyles(node: HTMLElement, styles: Styles) {
    const domStylesNames = [...node.style].map(key => ({used: false, name: key}));
    const domStyle = (node.style as {}) as Styles;
    const diff = {} as Styles;
    for (const styleName in styles) {
        const domStyleName = domStylesNames.find(style => style.name === styleName);
        if (domStyleName !== undefined) {
            domStyleName.used = true;
            if (styles[styleName] !== domStyle[styleName]) {
                diff[styleName] = styles[styleName];
            }
        } else {
            diff[styleName] = styles[styleName];
        }
    }
    for (const domStyleName of domStylesNames) {
        if (!domStyleName.used) {
            diff[domStyleName.name] = '';
        }
    }
    return diff;
}

function createDiffFromRealDom(node: HTMLElement, attrs: Attrs) {
    const domAttrs = [...node.attributes].map(attr => ({
        name: attr.nodeName,
        value: attr.nodeValue,
        used: false,
    }));
    const attrsDiff = ([] as unknown) as Attrs;
    for (let i = 0; i < attrs.length; i += 2) {
        const attrName = attrs[i] as string;
        const attrValue = attrs[i + 1];
        const domAttr = domAttrs.find(domAttr => domAttr.name === attrName);
        if (domAttr !== undefined) {
            domAttr.used = true;
            if (attrName === 'style') {
                const styleDiff = createDiffFromStyles(node, attrValue as Styles);
                attrsDiff.push(attrName, styleDiff);
            } else {
                if (domAttr.value !== attrValue) {
                    attrsDiff.push(attrName, attrValue);
                }
            }
        } else {
            attrsDiff.push(attrName, attrValue);
        }
    }
    for (const attr of domAttrs) {
        if (!attr.used) {
            attrsDiff.push(attr.name, null);
        }
    }
    return attrsDiff;
}

function setAttrs(node: HTMLElement, attrs: Attrs) {
    for (let i = 0; i < attrs.length; i += 2) {
        const attr = attrs[i] as string;
        const value = attrs[i + 1];
        if (value === null) {
            if (attr === 'xlinkHref') {
                node.removeAttributeNS(xlinkNS, 'xlink:href');
            } else {
                node.removeAttribute(attr);
            }
        } else if (attr === 'style') {
            const diffStyles = value as Styles;
            const domStyle = node.style;
            for (const styleName in diffStyles) {
                const value = diffStyles[styleName];
                if (value === '') {
                    domStyle[styleName as never] = '';
                }
            }
            for (const styleName in diffStyles) {
                const value = diffStyles[styleName];
                if (value !== '') {
                    domStyle[styleName as never] = value;
                }
            }
        } else if (attr === 'xlinkHref') {
            node.setAttributeNS(xlinkNS, 'xlink:href', value as string);
        } else {
            node.setAttribute(attr, value as string);
        }
    }
}
