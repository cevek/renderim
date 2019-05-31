function isCallback(arg: unknown): arg is RPCCallback {
    return typeof arg === 'object' && arg !== null && (arg as RPCCallback).type === '__fn__';
}
function transformArg(callback: unknown) {
    if (isCallback(callback)) {
        return (...args: unknown[]) => {
            sendToBackend([
                createResult(callback.id, args.map((arg, i) => extractProps(arg, callback.extractArgs[i]))),
            ]);
            return callback.returnValue;
        };
    }
    return callback;
}
function transformCallback(callback: RPCCallback) {
    return {
        onValue: (...args: unknown[]) => {
            sendToBackend([
                createResult(callback.id, args.map((arg, i) => extractProps(arg, callback.extractArgs[i]))),
            ]);
            return callback.returnValue;
        },
        onError: (error: Error | string) => {
            sendToBackend([createError(callback.id, error)]);
        },
    };
}

function sendToBackend(data: RPCResult[]) {}

function handleRPCCommand(command: RPCCommand) {
    const {id, obj, path} = command;
    let o = (getNode(obj) as unknown) as {[key: string]: unknown};
    const lastPart = path[path.length - 1];
    for (let i = 0; i < path.length - 1; i++) {
        if (typeof o === 'object' && o !== null) {
            o = o[path[i]] as {[key: string]: unknown};
        } else {
            sendToBackend([createError(id, `${o}.${path[i]} is not an object`)]);
            return;
        }
    }
    if (command.type === 'call') {
        if (typeof o[lastPart] === 'function') {
            const ret = (o[lastPart] as (...args: unknown[]) => void)(...command.args.map(transformArg));
            sendToBackend([createResult(id, [extractProps(ret, command.extract)])]);
        } else {
            sendToBackend([createError(id, `${o}.${lastPart} is not callable`)]);
        }
    } else if (command.type === 'read') {
        sendToBackend([createResult(id, [extractProps(o[lastPart], command.extract)])]);
    } else if (command.type === 'write') {
        o[lastPart] = transformArg(command.value);
    } else {
        nevr(command);
    }
}

function createResult(id: string, data: unknown[]): RPCResult {
    return {id, isError: false, type: '__res__', data};
}
function createError(id: string, error: unknown): RPCResult {
    return {id, isError: true, type: '__res__', data: [error]};
}

function extractProps(from: unknown, shape: unknown, root = from): unknown {
    type Hash = {[key: string]: unknown};
    if (shape === undefined) return;
    if (Array.isArray(shape)) {
        if (Array.isArray(from)) {
            return from.map(val => extractProps(val, shape[0], root));
        } else {
            return [];
        }
    } else if (Array.isArray(from)) {
        return;
    }
    if (typeof shape === 'object' && shape !== null && from !== null && typeof from === 'object') {
        const res = {} as Hash;
        for (const key in shape) {
            if (key === '__args') continue;
            if (key === '__conditions') continue;
            const subShape = (shape as Hash)[key] as {__args?: unknown[]; __conditions?: unknown[]};
            let subFrom = (from as Hash)[key];
            const args = subShape.__args;
            const conditions = subShape.__conditions;
            if (args !== undefined && typeof subFrom === 'function') {
                if (conditions === undefined || conditions.some(cond => isObjectExtends(root, cond))) {
                    subFrom = (from as {[name: string]: (...args: unknown[]) => unknown})[key](...args);
                }
            }
            res[key] = extractProps(subShape, subFrom, root);
        }
        return res;
    }
    return from;
}

function isObjectExtends(obj: unknown, base: unknown) {
    if (
        typeof obj === 'object' &&
        typeof base === 'object' &&
        obj !== null &&
        base !== null &&
        obj.constructor === base.constructor
    ) {
        type Hash = {[key: string]: unknown};
        if (Array.isArray(base)) {
            if (!base.every((subBase, i) => isObjectExtends((obj as Hash)[i], subBase))) return false;
        } else {
            for (const key in base) {
                if (!isObjectExtends((obj as Hash)[key], (base as Hash)[key])) return false;
            }
        }
        return true;
    }
    return obj === base;
}
