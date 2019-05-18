let id = 0;
const defaultProps = {};
const commandList: Command[] = [];
let currentComponent: VComponentNode;
const roots = new Map<ID, VNode>();
// let lastComponentError:Error | undefined;
let suspensePromises: Promise<unknown>[] = [];
