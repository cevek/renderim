if (typeof self.document !== 'object') {
    (self as {document: {}}).document = {
        createElement(tagName: string) {
            return {tagName};
        },
        querySelectorAll(query: string) {
            if (query === 'link[rel="stylesheet"]') {
                // update styles
            }
            return [];
        },
        getElementsByTagName(query: string) {
            if (query === 'head') {
                return [
                    {
                        appendChild(node: {tagName: string; src: string; onload: () => void; onerror: () => void}) {
                            if (node.tagName === 'script') {
                                // load script
                            } else if (node.tagName === 'link') {
                                // load link
                            }
                        },
                    },
                ];
            }
            return [];
        },
    };
}
