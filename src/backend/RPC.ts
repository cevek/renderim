function sendCommands(commands: readonly Command[]) {
    (self.postMessage as (data: unknown) => void)(commands);
}

let callbackId = 0;
const callbackMap = new Map<string, DisposableCallback>();
function transformCallback(callback: Function, extractArgs: object[], returnValue?: unknown): RPCCallback {
    const callbackWithCommand = callback as DisposableCallback;
    if (callbackWithCommand.command !== undefined) {
        const command = callbackWithCommand.command;
        if (isObjectSame(command.extractArgs, extractArgs) && isObjectSame(command.returnValue, returnValue)) {
            return callbackWithCommand.command;
        }
    }
    const id = String(callbackId++);
    const command: RPCCallback = {
        type: '__fn__',
        id,
        extractArgs,
        returnValue,
    };
    callbackWithCommand.command = command;
    callbackMap.set(id, callbackWithCommand);
    return command;
}
function disposeCallback(callback: Function) {
    const callbackWithCommand = callback as DisposableCallback;
    const command = nonNull(callbackWithCommand.command);
    callbackMap.delete(command.id);
    callbackWithCommand.command = undefined;
}
function transformCallbackOnce(callback: Function, extractArgs: object[], returnValue?: unknown): RPCCallback {
    const command = transformCallback(callback, extractArgs, returnValue);
    disposeCallback(callback);
    return command;
}
// function createPromise<T>(extractArgs: object[], returnValue?: unknown) {
//     return new Promise<T>((resolve, reject) => {
//         transformCallbackOnce(resolve as () => void, reject, extractArgs, returnValue);
//     });
// }

self.addEventListener('message', msg => {
    const data: RPCResult[] = msg.data;
    if (Array.isArray(data)) {
        for (const item of data) {
            if (isObj<RPCResult>(item) && item.type === '__res__') {
                const callbackObj = callbackMap.get(item.id);
                if (callbackObj === undefined) throw new Error('Callback is not registered');
                callbackObj(...item.data);
            }
        }
    }
});
