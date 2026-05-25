export function isValidNumber(v: any): v is number {
    return typeof v === "number" && !Number.isNaN(v) && Number.isFinite(v);
}

export function toValidNumber(
    v: unknown,
    opts: { requireInt?: boolean; coerceInt?: "round" | "floor" | "ceil" | "truncate" } = {}
): number | null {
    const { requireInt = false, coerceInt } = opts;
    if (v == null) return null;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "bigint") {
        const n = Number(v);
        if (!isValidNumber(n)) return null;
        return n;
    }
    if (v instanceof Date) {
        const t = v.getTime();
        return Number.isNaN(t) ? null : t;
    }

    let raw = typeof v === "number" ? v : String(v).trim();
    if (typeof raw === "string") {
        raw = raw.replace(/[,\s_]/g, "");
    }

    let n = Number(raw);
    if (!isValidNumber(n)) return null;

    if (coerceInt) {
        switch (coerceInt) {
            case "round": n = Math.round(n); break;
            case "floor": n = Math.floor(n); break;
            case "ceil": n = Math.ceil(n); break;
            case "truncate": n = Math.trunc(n); break;
        }
    }

    if (requireInt && !Number.isInteger(n)) return null;
    return n;
}

export function clamp(opts: { val: number; min: number; max: number }): number;
export function clamp(opts: { val: bigint; min: bigint; max: bigint }): bigint;
export function clamp(opts: { val: any; min: any; max: any }): any {
    const { val, min, max } = opts;
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

export function isValidInt(v: unknown): v is number | bigint {
    if (typeof v === "number") {
        return Number.isInteger(v) && !Number.isNaN(v) && Number.isFinite(v);
    }
    return typeof v === "bigint";
}

export const INT_RANGES = {
    Int8: { min: -128, max: 127 },
    Int16: { min: -32768, max: 32767 },
    Int32: { min: -2147483648, max: 2147483647 },
    UInt8: { min: 0, max: 255 },
    UInt16: { min: 0, max: 65535 },
    UInt32: { min: 0, max: 4294967295 }
} as const;

export type IntRangeType = keyof typeof INT_RANGES;

export function coerceInt(
    v: unknown,
    range?: { min: number; max: number } | IntRangeType
): number | null {
    const num = toValidNumber(v);
    if (num === null) return null;
    const truncated = Math.trunc(num);
    if (!range) return truncated;

    const limits = typeof range === "string" ? INT_RANGES[range] : range;
    return clamp({ val: truncated, min: limits.min, max: limits.max });
}

export const BIGINT_RANGES = {
    Int64: { min: -9223372036854775808n, max: 9223372036854775807n },
    UInt64: { min: 0n, max: 18446744073709551615n }
} as const;

export type BigIntRangeType = keyof typeof BIGINT_RANGES;

export function coerceBigInt(
    v: unknown,
    range: { min: bigint; max: bigint } | BigIntRangeType
): bigint | null {
    if (v == null) return null;
    try {
        let bigintVal: bigint;
        if (typeof v === "bigint") {
            bigintVal = v;
        } else if (typeof v === "number") {
            bigintVal = BigInt(Math.trunc(v));
        } else if (typeof v === "boolean") {
            bigintVal = v ? 1n : 0n;
        } else if (v instanceof Date) {
            const t = v.getTime();
            if (Number.isNaN(t)) return null;
            bigintVal = BigInt(t);
        } else {
            const str = String(v);
            const dotIdx = str.indexOf(".");
            const cleanStr = dotIdx !== -1 ? str.slice(0, dotIdx) : str;
            bigintVal = BigInt(cleanStr);
        }
        const limits = typeof range === "string" ? BIGINT_RANGES[range] : range;
        return clamp({ val: bigintVal, min: limits.min, max: limits.max });
    } catch {
        return null;
    }
}
