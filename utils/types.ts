export function isScalar(v: unknown): v is string | number | boolean | bigint | Date {
    return (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        typeof v === "bigint" ||
        v instanceof Date
    );
}

export function isObj(v: unknown): v is Record<string, unknown> {
    return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function isPlainObj(v: unknown): v is Record<string, unknown> {
    if (!isObj(v)) return false;
    const proto = Object.getPrototypeOf(v);
    return proto === null || proto === Object.prototype;
}

export function isNonEmptyObj(v: unknown): v is Record<string, unknown> {
    return isObj(v) && Object.keys(v).length > 0;
}

export function isNonEmptyArray<T = unknown>(arr: unknown): arr is T[] {
    return Array.isArray(arr) && arr.length > 0;
}

export function isNonEmptyArrayObjs<T extends object>(arr: unknown): arr is T[] {
    return isNonEmptyArray(arr) && arr.every(isObj);
}

export function toValidBinary(v: unknown): Uint8Array | null {
    if (v == null) return null;
    if (v instanceof Uint8Array) return v;
    if (typeof v === "string") {
        return new TextEncoder().encode(v);
    }
    if (Array.isArray(v) || (typeof v === "object" && "length" in v)) {
        try {
            return new Uint8Array(v as any);
        } catch {
            return null;
        }
    }
    return null;
}

export function isValidBinary(v: unknown): boolean {
    return toValidBinary(v) !== null;
}
