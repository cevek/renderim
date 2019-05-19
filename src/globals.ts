let id = 0;
let _id = 0;
const commandList: Command[] = [];
const roots = new Map<ID, VNode>();
let currentComponent: VComponentNode | undefined;
let currentSuspense: VSuspenseNode | undefined;
let currentErrorBoundary: VErrorBoundaryNode | undefined;
let updatedComponents: {new: VComponentNode; old: VComponentNode}[] = [];

