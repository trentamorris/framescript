import { isArray } from "./types";
import { toValidNumber } from "./number";

export function getListSumAndCount(arr: unknown): { sum: number | null; count: number } {
    if (!isArray(arr)) return { sum: null, count: 0 };
    let total = 0;
    let count = 0;
    const list = Array.from(arr as any);
    for (const val of list) {
        const n = toValidNumber(val);
        if (n !== null) {
            total += n;
            count++;
        }
    }
    return { sum: count > 0 ? total : null, count };
}

export function getListMax(arr: unknown): any {
    if (!isArray(arr)) return null;
    const list = Array.from(arr as any);
    if (list.length === 0) return null;
    let maxVal: any = null;
    for (const val of list) {
        if (val == null) continue;
        if (maxVal == null || val > maxVal) {
            maxVal = val;
        }
    }
    return maxVal;
}

export function getListMin(arr: unknown): any {
    if (!isArray(arr)) return null;
    const list = Array.from(arr as any);
    if (list.length === 0) return null;
    let minVal: any = null;
    for (const val of list) {
        if (val == null) continue;
        if (minVal == null || val < minVal) {
            minVal = val;
        }
    }
    return minVal;
}
