let id = 0;
let _id = 0;
let commandList: Command[] = [];
const roots = new Map<ID, VNode>();
let currentComponent: VComponentNode;

let maybeCancelled: VNode[] = [];
let maybeRemoved: VNode[] = [];
let maybeObsolete: VNode[] = [];
let maybeRestarted: ({newNode: VComponentNode; oldNode: VComponentNode})[] = [];
let maybeUpdatedParent: ({node: VNode; newParent: VComponentNode})[] = [];

const GCVNodes = {
    cancelled: new WeakSet<VNode>(),
    obsolete: new WeakSet<VNode>(),
    removed: new WeakSet<VNode>(),
    cancelledComponents: new WeakSet<VComponentNode>(),
};

const rootSuspense: VSuspenseNode = freeze({
    _id: 0,
    children: undefined!,
    extra: freeze({
        promises: freeze([]),
        resolvedPromises: 0,
        timeoutAt: 0,
        components: freeze([]),
    }),
    type: Suspense as ComponentFun,
    id: undefined!,
    key: undefined,
    kind: componentKind,
    parentComponent: undefined,
    props: undefined!,
    status: 'active',
});
