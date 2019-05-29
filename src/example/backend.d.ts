declare function Fragment(props: {children: VInput}): VInput;
declare function Portal(props: {container: string; children: VInput}): VPortalNodeCreated;
declare type ErrorBoundaryProps = {
    children: VInput;
    fallback: (props: {errors: Error[]}) => VInput;
};
declare function ErrorBoundary(props: ErrorBoundaryProps): VInput;
declare type SuspenseProps = {
    children: VInput;
    timeout: number;
    fallback: VInput;
};
declare function Suspense(props: SuspenseProps): VInput;
declare function restartComponent(node: VComponentNode | VComponentNodeCreated): boolean;
declare function createContext<T>(
    defaultValue: T,
): {
    Provider: (props: {value: T; children: VInput}) => VInput;
    Consumer: (props: {children: (value: T) => VInput}) => VInput;
};
declare function createElement(
    type: string | ComponentFun,
    props: {
        [key: string]: unknown;
    } | null,
    ...children: VInput[]
): VNodeCreated;
declare function render(node: VInput, htmlId: string): void;
declare function unmount(htmlId: string): void;
