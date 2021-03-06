/// <reference path="./jsx.d.ts" />
interface Window {
    registerWorker(worker: Worker): void;
}
declare module 'renderim' {
    export type ComponentInstance = {__type: 'ComponentInstance'};
    export function Fragment(props: {children: JSX.InputElement}): JSX.Element;
    export function lazy<P>(cmp: () => Promise<{default: (props: P) => JSX.InputElement}>): (props: P) => JSX.Element;
    export function client<T>(
        src: () => Promise<{default: (dom: HTMLElement, props: T) => {update(props: T): void; destroy?(): void}}>,
    ): (props: T & {children?: JSX.Element}) => JSX.Element;
    export function loadClientScript(src: string | (() => Promise<unknown>)): void;
    export function Portal(props: {container: string; children: JSX.InputElement}): JSX.Element;
    export function ErrorBoundary(props: {
        children: JSX.InputElement;
        fallback: (error: Error) => JSX.Element | string;
    }): JSX.Element;
    export function Suspense(props: {
        children: JSX.InputElement;
        hideIfSuspended?: boolean;
        timeout: number;
        fallback: JSX.Element;
    }): JSX.Element;
    export function RootSuspense(props: {children: JSX.InputElement}): JSX.Element;
    export function restartComponent(node: JSX.Element): boolean;
    export function createContext<T>(
        defaultValue: T,
    ): {
        Provider: (props: {value: T; children: JSX.InputElement}) => JSX.Element;
        Consumer: (props: {children: (value: T) => JSX.InputElement}) => JSX.Element;
    };
    export function createElement(
        type: string | ((props: object) => JSX.Element),
        props: {
            [key: string]: unknown;
        } | null,
        ...children: JSX.InputElement[]
    ): JSX.Element;
    export function render(node: JSX.Element, htmlId: string): JSX.Element | undefined;
    export function unmountComponentAtNode(htmlId: string): void;

    export function withPreventDefault(cb: () => void): () => void;
    export function withStopProgation(cb: () => void): () => void;
    export function withTargetValue(cb: (value: string) => void): () => void;
    export function withTargetChecked(cb: (value: boolean) => void): () => void;
    export function withEventData<T extends object>(cb: (value: T) => void, shape: T): () => void;

    export const CancellationToken: {readonly cancellationToken: 'cancellationToken'};

    export function IntersectionObserverContainer(props: {
        children: JSX.InputElement;
        rootMargin?: string;
        threshold?: string | number;
    }): JSX.Element;

    export function IntersectionObserverElement<T extends DeepPartial<IntersectionObserverElementCallbackParams>>(
        props: {children: JSX.InputElement} & IntersectionObserverElementProps<T>,
    ): JSX.Element;

    export function getNodeRootId(node: JSX.Element): string;
    export function scheduleUpdate(cb: () => void): void;
    export function cancelUpdating(): void;
    export function getCurrentComponent(): ComponentInstance;
    export function restartComponent(node: ComponentInstance);
    export function setHook(
        type: 'beforeComponent' | 'afterComponent' | 'unmountComponent' | 'restartComponent' | 'cancelComponent',
        value: (node: JSX.Element) => void,
    ): void;

    type DeepPartial<T> = {[P in keyof T]?: DeepPartial<T[P]>};

    type IntersectionObserverElementCallbackParams = {
        intersectionRatio: number;
        boundingClientRect: BoundingClientRect;
        intersectionRect: BoundingClientRect;
        rootBounds: BoundingClientRect;
    };
    type IntersectionObserverElementProps<T extends DeepPartial<IntersectionObserverElementCallbackParams>> = {
        onVisible: (params: T) => void;
        onInvisible?: () => void;
        onVisibleParams?: T;
    };
}
