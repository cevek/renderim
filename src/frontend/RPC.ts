type RPCCommand = RPCReadCommand | RPCCallCommand | RPCWriteCommand;
type RPCCallback = {type: '__fn__'; id: string; extractArgs: object[]; return?: unknown};
type RPCReadCommand = {type: 'read'; id: string; obj: ID; path: string[]; extract: object};
type RPCCallCommand = {type: 'call'; id: string; obj: ID; path: string[]; args: unknown[]; extract: object};
type RPCWriteCommand = {type: 'write'; id: string; obj: ID; path: string[]; value: unknown};

function isCallback(arg: unknown): arg is RPCCallback {
    return typeof arg === 'object' && arg !== null && (arg as RPCCallback).type === '__fn__';
}
function transformArg(callback: unknown) {
    if (isCallback(callback)) {
        return (...args: unknown[]) => {
            sendBack([{id: callback.id, data: args.map((arg, i) => extractProps(arg, callback.extractArgs[i]))}]);
            return callback.return;
        };
    }
    return callback;
}

function sendBack(data: {id: string; data: unknown}[]) {}

function handleRPCCommand(command: RPCCommand) {
    const {id, obj, path} = command;
    let o = (getNode(obj) as unknown) as {[key: string]: unknown};
    const lastPart = path[path.length - 1];
    for (let i = 0; i < path.length - 1; i++) {
        if (typeof o === 'object' && o !== null) {
            o = o[path[i]] as {[key: string]: unknown};
        } else {
            sendBack([{id, data: {type: '__error__', reason: `${o}.${path[i]} is not an object`}}]);
            return;
        }
    }
    if (command.type === 'call') {
        if (typeof o[lastPart] === 'function') {
            const ret = (o[lastPart] as (...args: unknown[]) => void)(...command.args.map(transformArg));
            sendBack([{id, data: extractProps(ret, command.extract)}]);
        } else {
            sendBack([{id, data: {type: '__error__', reason: `${o}.${lastPart} is not callable`}}]);
        }
    } else if (command.type === 'read') {
        sendBack([{id, data: extractProps(o[lastPart], command.extract)}]);
    } else if (command.type === 'write') {
        o[lastPart] = transformArg(command.value);
    } else {
        nevr(command);
    }
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
