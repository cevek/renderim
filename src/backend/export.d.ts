/// <reference path="../common/jsx.d.ts" />
declare module 'renderim' {
    export function Fragment(props: {children: JSX.InputElement}): JSX.Element;
    export function lazy<T extends (props: any) => JSX.Element>(
        cmp: () => Promise<{default: T}>,
    ): (props: Parameters<T>[0]) => JSX.Element;
    export function Portal(props: {container: string; children: JSX.InputElement}): JSX.Element;
    export function ErrorBoundary(props: {children: JSX.InputElement; fallback: (props: {errors: Error[]}) => JSX.Element}): JSX.Element;
    export function Suspense(props: {children: JSX.InputElement; hideIfSuspended?: boolean; timeout: number; fallback: JSX.Element}): JSX.Element;
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
    export function render(node: JSX.Element, htmlId: string): void;
    export function unmountComponentAtNode(htmlId: string): void;

    export function withPreventDefault(cb: () => void): () => void;
    export function withStopProgation(cb: () => void): () => void;
    export function withTargetValue(cb: (value: string) => void): () => void;
    export function withTargetChecked(cb: (value: boolean) => void): () => void;
    export function withEventData<T extends object>(cb: (value: T) => void, shape: T): () => void;

    export function IntersectionObserverContainer(props: {
        children: JSX.InputElement;
        rootMargin?: string;
        threshold?: string | number;
    }): JSX.Element;

    export function IntersectionObserverElement<T extends DeepPartial<IntersectionObserverElementCallbackParams>>(
        props: {children: JSX.InputElement} & IntersectionObserverElementProps<T>,
    ): JSX.Element;

    export function setHook(type: 'beforeComponent' | 'afterComponent' | 'unmountComponent', value: (node: JSX.Element) => void): void;
}
