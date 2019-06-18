
interface Array<T> {
    [key: number]: T;
    readonly length: number;
    map<R>(fn: (val: T, i: number) => R): R[];
    every<R>(fn: (val: T, i: number) => R): boolean;
    filter<R>(fn: (val: T, i: number) => boolean): T[];
    find<R>(fn: (val: T, i: number) => boolean): T | undefined;
    push(val: T): void;
    includes(value: T): boolean;
    indexOf(value: T): number;
    [Symbol.iterator](): IterableIterator<T>;
}
declare function Symbol(name: string): symbol;
declare namespace Symbol {
    const iterator: symbol;
}
declare class Error {
    constructor(name: string);
}
declare function Array(size: number): [];
declare namespace Array {
    function isArray(val: unknown): val is any[];
}
declare const Math: {
    min(...args: number[]): number;
};
declare class Date {
    static now(): number;
}
declare class Map<K, V> {
    set(key: K, value: V): void;
    get(key: K): V | undefined;
    delete(key: K): void;
    clear(): void;
    values(): IterableIterator<V>;
    readonly size: number;
    [Symbol.iterator](): IterableIterator<[K, V]>;
}
declare class Object {
    static keys(val: object): string[];
}
declare class WeakSet<V> {
    add(value: V): void;
}
declare const self: {
    postMessage(): void;
    addEventListener(msg: string, cb: (data: {data: unknown}) => void): void;
    window: {};
    document: {};
};
declare function importScripts(src: string): void;
declare class Promise<T> {
    constructor(val: (resolve: (val?: T) => void, reject: (val?: unknown) => void) => void);
    then<R>(fn: (val: T) => Promise<R> | R, rej?: (err: Error) => R): Promise<R>;
    static race(arr: Promise<unknown>[]): Promise<unknown>;
    static all(arr: Promise<unknown>[]): Promise<unknown>;
}
declare function String(val: unknown): string;
declare function setTimeout(fn: () => void, ms?: number): void;

declare const console: {log(...args: unknown[]): void; warn(...args: unknown[]): void};

type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
type Pick<T, K extends keyof T> = {[P in K]: T[P]};
type Exclude<T, U> = T extends U ? never : T;
type CSSStyleDeclaration = {};
type Partial<T> = {[P in keyof T]?: T[P]};
interface IteratorResult<T> {
    done: boolean;
    value: T;
}

interface Iterator<T> {
    next(value?: any): IteratorResult<T>;
    return?(value?: any): IteratorResult<T>;
    throw?(e?: any): IteratorResult<T>;
}

interface Iterable<T> {
    [Symbol.iterator](): Iterator<T>;
}

interface IterableIterator<T> extends Iterator<T> {
    [Symbol.iterator](): IterableIterator<T>;
}

interface Function {
    readonly name: string;
}

interface Symbol {}
interface Boolean {}
interface Number {}
interface Object {}
interface RegExp {}
interface String {}
interface IArguments {}
interface CallableFunction extends Function {}
interface NewableFunction extends Function {}
