function sendCommands(commands: readonly Command[]) {
    (self.postMessage as Worker['postMessage'])(commands);
}

let callbackId = 0;
const callbackMap = new Map<string, {onValue: (...args: unknown[]) => void; onError: (err: Error) => void}>();
function transformCallback(
    callback: (...args: unknown[]) => void,
    errCallback: (err: Error) => void,
    extractArgs: object[],
    returnValue?: unknown,
): {dispose: () => void; data: RPCCallback} {
    const id = String(callbackId++);
    callbackMap.set(id, {onValue: callback, onError: errCallback});
    return {
        dispose() {
            callbackMap.delete(id);
        },
        data: {
            type: '__fn__',
            id: id,
            extractArgs,
            returnValue,
        },
    };
}
function transformCallbackOnce(
    callback: (...args: unknown[]) => void,
    errCallback: (err: Error) => void,
    extractArgs: object[],
    returnValue?: unknown,
): RPCCallback {
    const {dispose, data} = transformCallback(
        (...args) => {
            dispose();
            callback(...args);
        },
        err => {
            dispose();
            errCallback(err);
        },
        extractArgs,
        returnValue,
    );
    return data;
}
function createPromise<T>(extractArgs: object[], returnValue?: unknown) {
    return new Promise<T>((resolve, reject) => {
        transformCallbackOnce(resolve as () => void, reject, extractArgs, returnValue);
    });
}

self.addEventListener('message', msg => {
    const data: RPCResult[] = msg.data;
    if (Array.isArray(data)) {
        for (const item of data) {
            if (isObj<RPCResult>(item) && item.type === '__res__') {
                const callbackObj = callbackMap.get(item.id);
                if (callbackObj === undefined) throw new Error('Callback is not registered');
                if (item.isError) {
                    callbackObj.onError(item.data[0] as Error);
                } else {
                    callbackObj.onValue(...item.data);
                }
            }
        }
    }
});
