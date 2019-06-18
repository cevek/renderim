let nodeIdCounter = 0;
let vNodeIdCounter = 0;
let commandList: Command[] = [];
const roots = new Map<RootId, VNode>();
let currentComponent: VComponentNodeCreated | undefined;

const hooks = {
    beforeComponent(node: VComponentNodeCreated) {},
    afterComponent(node: VComponentNodeCreated) {},
    unmountComponent(node: VComponentNodeCreated) {},
    restartComponent(node: VComponentNodeCreated) {},
};

let rootSuspended = false;
let isMounting = false;
let now = Date.now();
let maybeCancelled: VNodeCreated[] = [];
let maybeRemoved: VNode[] = [];
let maybeObsolete: VNode[] = [];
let updatedComponents: ({node: VComponentNode; isRestart: boolean; newChild: VNodeCreated})[] = [];
let maybeUpdatedParent: ({node: VNode; newParent: ParentComponent})[] = [];
const windowObj = {} as ID;
const clientLoadedScripts = new Map<string, true | Error>();

let shedule: (() => void)[] = [];

let isCustomUrlCall = false;
const GCVNodes = process.env.NODE_ENV === 'development' ? new WeakSet<VNodeCreated | VNode>() : undefined;
((self as {}) as {GCVNodes: typeof GCVNodes}).GCVNodes = GCVNodes;
const kindParent = {type: 'kind'};
const componentKind = ({kind: 'component', parent: kindParent} as unknown) as 'component';
const domKind = ({kind: 'dom', parent: kindParent} as unknown) as 'dom';
const textKind = ({kind: 'text', parent: kindParent} as unknown) as 'text';
const arrayKind = ({kind: 'array', parent: kindParent} as unknown) as 'array';
const portalKind = ({kind: 'portal', parent: kindParent} as unknown) as 'portal';
