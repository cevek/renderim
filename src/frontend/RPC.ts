function transformArg(command: unknown) {
    if (isObject<RPCCallback>(command) && command.type === '__fn__') {
        return transformCallback(command);
    }
    return command;
}
function transformCallback(command: RPCCallback) {
    const callback = (...args: unknown[]) => {
        sendToBackend([createResult(command.id, args.map((arg, i) => extractProps(arg, command.extractArgs[i])))]);
        return command.returnValue;
    };
    return callback;
}

function sendToBackend(data: RPCResult[]) {
    WORKER.postMessage(data);
}

function handleRPCCommand(command: RPCCommand) {
    type Hash = {[key: string]: Hash};
    const {obj, path} = command;
    let o = (getNode(obj) as unknown) as {[key: string]: unknown};
    const lastPart = path[path.length - 1];
    for (let i = 0; i < path.length - 1; i++) {
        if (isObject<Hash>(o)) {
            o = o[path[i]];
        } else {
            sendToBackend([createError(command.callback.id, `${o}.${path[i]} is not an object`)]);
            return;
        }
    }
    if (command.action === 'call') {
        if (typeof o[lastPart] === 'function') {
            const ret = (o[lastPart] as (...args: unknown[]) => void)(...command.args.map(transformArg));
            // console.log('RPC call', command);
            transformCallback(command.callback)(ret);
        } else {
            sendToBackend([createError(command.callback.id, `${o}.${lastPart} is not callable`)]);
        }
    } else if (command.action === 'read') {
        // console.log('RPC read', command);
        transformCallback(command.callback)(o[lastPart]);
    } else if (command.action === 'write') {
        // console.log('RPC write', command);
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
    type Hash = {[key: string]: Hash | ((...args: unknown[]) => Hash)};
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
    if (isObject<Hash>(shape) && isObject<Hash>(from)) {
        const res: Hash = {};
        for (const key in shape) {
            if (key === '__args') continue;
            if (key === '__conditions') continue;
            const subShape = shape[key] as {__args?: unknown[]; __conditions?: unknown[]};
            let subFrom = from[key];
            const args = subShape.__args;
            const conditions = subShape.__conditions;
            if (args !== undefined && typeof from[key] === 'function') {
                if (conditions === undefined || conditions.some(cond => isObjectExtends(root, cond))) {
                    subFrom = (from[key] as ((...args: unknown[]) => Hash))(...args);
                }
            }
            res[key] = extractProps(subFrom, subShape, root) as Hash;
        }
        return res;
    }
    return from;
}

function isObjectExtends(obj: unknown, base: unknown) {
    type Hash = {[key: string]: unknown};
    if (isObject<Hash>(obj) && isObject<Hash>(base) && obj.constructor === base.constructor) {
        if (Array.isArray(base)) {
            if (!base.every((subBase, i) => isObjectExtends(obj[i], subBase))) return false;
        } else {
            for (const key in base) {
                if (!isObjectExtends(obj[key], base[key])) return false;
            }
        }
        return true;
    }
    return obj === base;
}
