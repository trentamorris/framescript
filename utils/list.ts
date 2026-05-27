import { isArray, isObj } from "./types";
import { isValidDateObj } from "./date";
import { toValidNumber } from "./number";

export type ArrayItemType = "string" | "number" | "boolean" | "bigint" | "object" | "date" | ((v: unknown) => boolean);
export type ArrayCheckMode = "every" | "some";

export function isArrayOfType(
    arr: unknown,
    type: ArrayItemType,
    options: { mode?: ArrayCheckMode; includeNulls?: boolean } = {}
): boolean {
    if (!isArray(arr)) return false;
    const list = Array.from(arr as any);
    const mode = options?.mode ?? "every";

    const check = (v: unknown) => {
        if (v == null && options?.includeNulls) return true;
        if (typeof type === "function") return type(v);
        if (type === "date") return isValidDateObj(v);
        if (type === "object") return isObj(v);
        return typeof v === type;
    };

    return mode === "every" ? list.every(check) : list.some(check);
}

export function sortList(arr: unknown, descending: boolean = false): any[] {
    if (!isArray(arr)) return [];
    const list = Array.from(arr as any);
    list.sort((a, b) => {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        if (a < b) return descending ? 1 : -1;
        if (a > b) return descending ? -1 : 1;
        return 0;
    });
    return list;
}

export function getListStats(arr: unknown): {
    sum: number | null;
    count: number;
    min: any;
    max: any;
} {
    if (!isArray(arr)) {
        return { sum: null, count: 0, min: null, max: null };
    }
    const list = Array.from(arr as any);
    if (list.length === 0) {
        return { sum: null, count: 0, min: null, max: null };
    }

    let total = 0;
    let count = 0;
    let minVal: any = null;
    let maxVal: any = null;

    for (const val of list) {
        if (val == null) continue;

        if (minVal == null || val < minVal) minVal = val;
        if (maxVal == null || val > maxVal) maxVal = val;

        const n = toValidNumber(val);
        if (n !== null) {
            total += n;
            count++;
        }
    }

    return {
        sum: count > 0 ? total : null,
        count,
        min: minVal,
        max: maxVal
    };
}

export function getListMedian(arr: unknown): number | null {
    if (!isArray(arr) || !isArrayOfType(arr, "number", { includeNulls: true })) return null;

    const nums = (Array.from(arr as any) as (number | null)[]).filter((v) => v != null) as number[];
    if (nums.length === 0) return null;

    const sorted = sortList(nums);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function getListMode(arr: unknown): any[] | null {
    if (!isArray(arr)) return null;
    const list = Array.from(arr as any);

    const counts = new Map<any, number>();
    let maxCount = 0;

    for (const val of list) {
        if (val == null) continue;
        const c = (counts.get(val) ?? 0) + 1;
        counts.set(val, c);
        if (c > maxCount) maxCount = c;
    }

    if (maxCount === 0) return [];

    const modes: any[] = [];
    for (const [val, c] of counts.entries()) {
        if (c === maxCount) modes.push(val);
    }

    return sortList(modes);
}
