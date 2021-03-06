/// <reference path="../../jsx.d.ts" />

type RootId = 'RootId';
type ID = {id: 'ID'} & number;
type Attrs = {readonly [key: string]: unknown; withCommand?: JSX.AttrsCommand};
type Styles = {[key: string]: string};

type TagCommand = CreateTagCommand | UpdateTagCommand | MoveTagCommand | RemoveTagCommand;
type TextCommand = CreateTextCommand | UpdateTextCommand | MoveTextCommand | RemoveTextCommand;
type MountCommand = MountStartCommand | MountEndCommand;
type CustomCommand = CreateCustomCommand | UpdateCustomCommand | RemoveCustomCommand;
type LoadCommand = LoadScriptCommand | LoadStyleCommand | UpdateStyleCommand;
type DevtoolsCommand = UpdateDevtools;
type Command = TagCommand | TextCommand | MountCommand | CustomCommand | LoadCommand | DevtoolsCommand | RPCCommand;

type MountStartCommand = {
    group: 'mount';
    action: 'start';
    rootId: RootId;
};
type MountEndCommand = {
    group: 'mount';
    action: 'end';
    rootId: RootId;
};

type CreateTagCommand = {
    group: 'tag';
    action: 'create';
    id: ID;
    rootId: RootId;
    parentId: ID | RootId;
    beforeId: ID | null;
    tag: string;
    attrs: Attrs;
};

type UpdateTagCommand = {
    group: 'tag';
    action: 'update';
    tag: string;
    id: ID;
    attrs: Attrs;
};
type MoveTagCommand = {
    group: 'tag';
    action: 'move';
    tag: string;
    id: ID;
    beforeId: ID | null;
};
type RemoveTagCommand = {
    group: 'tag';
    action: 'remove';
    tag: string;
    id: ID;
};

type MoveTextCommand = {
    group: 'text';
    action: 'move';
    id: ID;
    beforeId: ID | null;
};
type CreateTextCommand = {
    group: 'text';
    action: 'create';
    id: ID;
    rootId: RootId;
    parentId: ID | RootId;
    beforeId: ID | null;
    text: string;
};
type UpdateTextCommand = {
    group: 'text';
    action: 'update';
    id: ID;
    text: string;
};
type RemoveTextCommand = {
    group: 'text';
    action: 'remove';
    id: ID;
};

type CreateCustomCommand = {
    group: 'custom';
    action: 'create';
    parentId: ID;
    name: string;
    data: unknown;
};
type UpdateCustomCommand = {
    group: 'custom';
    action: 'update';
    name: string;
    data: unknown;
};
type RemoveCustomCommand = {
    group: 'custom';
    parentId: ID;
    action: 'remove';
    name: string;
    data: unknown;
};

type LoadScriptCommand = {
    group: 'script';
    action: 'load';
    url: string;
    onLoad: RPCCallback;
    onError: RPCCallback;
};
type LoadStyleCommand = {
    group: 'style';
    action: 'load';
    url: string;
    onLoad: RPCCallback;
    onError: RPCCallback;
};
type UpdateStyleCommand = {
    group: 'style';
    action: 'updateAll';
};

type UpdateDevtools = {
    group: 'devtools';
    action: 'update';
    isRoot: boolean;
    node: DevToolsNode | undefined;
    unmounted: ID[];
};

type DomListener = {oldListener?: RPCCallback; newListener?: RPCCallback};

type RPCCommand = RPCReadCommand | RPCCallCommand | RPCWriteCommand;
type RPCCallback = {type: '__fn__'; id: string; extractArgs: object[]; returnValue?: unknown};
type RPCResult = {type: '__res__'; id: string; isError: boolean; data: unknown[]};
type RPCReadCommand = {group: 'RPC'; action: 'read'; callback: RPCCallback; obj: ID; path: string[]};
type RPCCallCommand = {
    group: 'RPC';
    action: 'call';
    callback: RPCCallback;
    obj: ID;
    path: string[];
    args: unknown[];
};
type RPCWriteCommand = {group: 'RPC'; action: 'write'; callback: RPCCallback; obj: ID; path: string[]; value: unknown};

type BoundingClientRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};


interface DevToolsNode {
    readonly _id: ID;
    readonly _nodeId: ID;
    readonly _rootNodeID: RootId;
    readonly _instance: {};
    _renderedComponent: DevToolsNode | undefined;
    _currentElement: {type: string | Function; props: {[key: string]: unknown}} | string;
    _renderedChildren: DevToolsNode[];
    _stringText: string | undefined;
}

declare const exports: {[key: string]: unknown};
declare const process: {env: {NODE_ENV: 'production' | 'development'}};
