function sendCommands(commands: readonly Command[]) {
    (self.postMessage as (data: unknown) => void)(commands);
}

type Callback = ((...args: unknown[]) => void) & {command: RPCCallback};
let callbackId = 0;
const callbackMap = new Map<string, Callback>();
function transformCallback(
    callback: Function,
    extractArgs: object[],
    returnValue?: unknown,
): {command: RPCCallback; dispose: () => void} {
    const callbackWithCommand = callback as Callback;
    let id = callbackWithCommand.command !== undefined ? callbackWithCommand.command.id : String(callbackId++);
    const newCommand: RPCCallback = {
        type: '__fn__',
        id,
        extractArgs,
        returnValue,
    };
    if (!isObjectSame(callbackWithCommand.command, newCommand)) {
        id = String(callbackId++);
        newCommand.id = id;
        callbackWithCommand.command = newCommand;
        callbackMap.set(id, callbackWithCommand);
    }
    return {
        command: newCommand,
        dispose: () => {
            callbackMap.delete(id);
        },
    };
}
function transformCallbackOnce(
    callback: (...args: unknown[]) => void,
    extractArgs: object[],
    returnValue?: unknown,
): RPCCallback {
    const {dispose, command} = transformCallback(
        (...args: unknown[]) => {
            dispose();
            callback(...args);
        },
        extractArgs,
        returnValue,
    );
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
