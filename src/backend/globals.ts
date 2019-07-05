const GLOBAL_ROOTS = new Map<RootId, VNode>();
let GLOBAL_CLIENT_NODE_ID_COUNTER = 0;
let GLOBAL_VNODE_ID_COUNTER = 0;
let GLOBAL_COMMAND_LIST: Command[] = [];
let GLOBAL_CURRENT_COMPONENT: ComponentInstance | undefined;

const GLOBAL_HOOKS = {
    beforeComponent(node: VComponentNodeCreated) {},
    afterComponent(node: VComponentNodeCreated) {},
    unmountComponent(node: VComponentNodeCreated) {},
    restartComponent(node: VComponentNodeCreated) {},
    cancelComponent(node: VComponentNodeCreated) {},
};

let GLOBAL_UPDATE_CANCELLED = false;
let GLOBAL_MOUNTING = false;
let GLOBAL_NOW = Date.now();
let GLOBAL_TRX_ID = 1;

type Task =
    | {kind: 'created'; node: VNodeCreated}
    | {kind: 'removed'; node: VNode}
    | {kind: 'obsolete'; node: VNode}
    | {kind: 'parent'; node: VNode; newParent: ParentComponent}
    | {kind: 'updateComponent'; node: VComponentNode}
    | {kind: 'restart'; node: VComponentNode; newChild: VNodeCreated};

let GLOBAL_TASKS: Task[] = [];
const CLIENT_WINDOW_OBJECT_ID = {} as ID;

const GLOBAL_SCHEDULE: (() => void)[] = [];

const GLOBAL_CLIENT_SCRIPTS_MAP = new Map<Function | string, Promise<unknown> | Error | string>();

let GLOBAL_RPC_CALLBACK_ID_COUNTER = 0;
const GLOBAL_RPC_CALLBACK_MAP = new Map<string, Function>();

const GLOBAL_DEV_GC_VNODES = process.env.NODE_ENV === 'development' ? new WeakSet<VNodeCreated | VNode>() : undefined;
((self as {}) as {GCVNodes: typeof GLOBAL_DEV_GC_VNODES}).GCVNodes = GLOBAL_DEV_GC_VNODES;

const PARENT_KIND = {type: 'kind'};
const COMPONENT_KIND = ({kind: 'component', parent: PARENT_KIND} as unknown) as 'component';
const DOM_KIND = ({kind: 'dom', parent: PARENT_KIND} as unknown) as 'dom';
const TEXT_KIND = ({kind: 'text', parent: PARENT_KIND} as unknown) as 'text';
const ARRAY_KIND = ({kind: 'array', parent: PARENT_KIND} as unknown) as 'array';
const PORTAL_KIND = ({kind: 'portal', parent: PARENT_KIND} as unknown) as 'portal';

const CANCELLATION_TOKEN = {cancellationToken: true};
