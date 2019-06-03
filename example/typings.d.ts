/// <reference path="../src/common/jsx.d.ts" />
module 'renderim' {
    // export type VNode = {type: string | ((props: object) => VInput); props: object};
    export type VNode = JSX.Element;
    export type VInput = JSX.Element;

    export function Fragment(props: {children: VInput}): VInput;
    export function lazy<T extends (props: any) => VInput>(
        cmp: () => Promise<{default: T}>,
    ): (props: Parameters<T>[0]) => VNode;
    export function Portal(props: {container: string; children: VInput}): VNode;
    export function ErrorBoundary(props: {children: VInput; fallback: (props: {errors: Error[]}) => VInput}): VInput;
    export function Suspense(props: {children: VInput; timeout: number; fallback: VInput}): VInput;
    export function restartComponent(node: VNode): boolean;
    export function createContext<T>(
        defaultValue: T,
    ): {
        Provider: (props: {value: T; children: VInput}) => VInput;
        Consumer: (props: {children: (value: T) => VInput}) => VInput;
    };
    export function createElement(
        type: string | ((props: object) => VInput),
        props: {
            [key: string]: unknown;
        } | null,
        ...children: VInput[]
    ): VNode;
    export function render(node: VInput, htmlId: string): void;
    export function unmountComponentAtNode(htmlId: string): void;

    export function withPreventDefault(cb: () => void): () => void;
    export function withStopProgation(cb: () => void): () => void;
    export function withTargetValue(cb: (value: string) => void): () => void;
    export function withTargetChecked(cb: (value: boolean) => void): () => void;
    export function withEventData<T extends object>(cb: (value: T) => void, shape: T): () => void;

    export function IntersectionObserverContainer(props: {
        children: VNode;
        rootMargin?: string;
        threshold?: string | number;
    }): VNode;

    function IntersectionObserverElement<T extends DeepPartial<IntersectionObserverElementCallbackParams>>(
        props: {children: VNode} & IntersectionObserverElementProps<T>,
    ): VNode;
}
