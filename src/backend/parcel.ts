if (!isObj(self.document)) {
    (self as {document: {}}).document = {
        createElement(tagName: string) {
            return {tagName};
        },
        querySelectorAll(query: string) {
            if (query === 'link[rel="stylesheet"]') {
                sendCommands([
                    {
                        group: 'style',
                        action: 'updateAll',
                    },
                ]);
            }
            return [];
        },
        getElementsByTagName(query: string) {
            if (query === 'head') {
                return [
                    {
                        appendChild(node: {
                            tagName: string;
                            src: string;
                            href: string;
                            onload: () => void;
                            onerror: () => void;
                        }) {
                            if (node.tagName === 'script') {
                                if (isCustomUrlCall) {
                                    sendCommands([
                                        {
                                            group: 'script',
                                            action: 'load',
                                            url: node.href,
                                            onLoad: transformCallbackOnce(node.onload, []),
                                            onError: transformCallbackOnce(node.onerror, []),
                                        },
                                    ]);
                                } else {
                                    try {
                                        importScripts(node.src);
                                        node.onload();
                                    } catch (e) {
                                        node.onerror();
                                    }
                                }
                            } else if (node.tagName === 'link') {
                                sendCommands([
                                    {
                                        group: 'style',
                                        action: 'load',
                                        url: node.href,
                                        onLoad: transformCallbackOnce(node.onload, []),
                                        onError: transformCallbackOnce(node.onerror, []),
                                    },
                                ]);
                            }
                        },
                    },
                ];
            }
            return [];
        },
    };
}
