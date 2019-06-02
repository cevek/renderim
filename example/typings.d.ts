/// <reference path="../src/common/jsx" />
module 'renderim' {
    export type VNode = {type: string | ((props: object) => VInput); props: object};
    export type VInput = undefined | void | null | boolean | string | number | VNode | {[key: number]: VInput};

    export function Fragment(props: {children: VInput}): VInput;
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
}
