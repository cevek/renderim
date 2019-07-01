function sendCommands(commands: readonly Command[]) {
    (self.postMessage as (data: unknown) => void)(commands);
}

function transformCallbackBackend(callback: Function): RPCCallback {
    const callbackWithCommand = callback as CallbackWithCommand;
    if (callbackWithCommand.extractArgs === undefined) {
        callbackWithCommand.extractArgs = [];
    }
    if (callbackWithCommand.command !== undefined) {
        const command = callbackWithCommand.command;
        if (command.extractArgs === callbackWithCommand.extractArgs) {
            return callbackWithCommand.command;
        }
    }
    const id = String(callbackId++);
    const command: RPCCallback = {
        type: '__fn__',
        id,
        extractArgs: callbackWithCommand.extractArgs,
        returnValue: undefined,
    };
    callbackWithCommand.command = command;
    callbackMap.set(id, callbackWithCommand);
    return command;
}

function setDataToCallback<Args extends object[]>(callback: (...args: Args) => void, extractArgs: Args): () => void {
    const callbackWithCommand = callback as CallbackWithCommand;
    if (callbackWithCommand.extractArgs === undefined) {
        callbackWithCommand.extractArgs = extractArgs;
    } else {
        immutableDeepMerge(callbackWithCommand.extractArgs, extractArgs);
    }
    return callback;
}

function disposeCallback(callback: Function) {
    const callbackWithCommand = callback as CallbackWithCommand;
    const command = nonNull(callbackWithCommand.command);
    callbackMap.delete(command.id);
    callbackWithCommand.command = undefined;
}
function transformCallbackOnce(callback: Function): RPCCallback {
    const command = transformCallbackBackend((...args: unknown[]) => {
        callbackMap.delete(command.id);
        return callback(...args);
    });
    return command;
}
// function createPromise<T>(extractArgs: object[], returnValue?: unknown) {
//     return new Promise<T>((resolve, reject) => {
//         transformCallbackOnce(resolve as () => void, reject, extractArgs, returnValue);
//     });
// }

self.addEventListener('message', msg => {
    const data = msg.data as RPCResult[];
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
