function isObject<T extends object>(obj: unknown): obj is T {
    return typeof obj === 'object' && obj !== null;
}