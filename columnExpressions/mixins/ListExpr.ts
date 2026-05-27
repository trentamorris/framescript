import type { ExprConstructor } from "../../types";
import { kleene, derive } from "../ExprBase";
import { isArray, toValidNumber } from "../../utils";

class ListExprNamespace {
    constructor(private expr: any) {}

    private _deriveList(fn: (arr: any[] | ArrayBufferView) => any) {
        return derive(this.expr, kleene((v) => {
            return isArray(v) ? fn(v as any) : null;
        }));
    }

    lengths() {
        return this._deriveList((arr) => (arr as any).length);
    }

    len() {
        return this.lengths();
    }

    max() {
        return this._deriveList((arr) => {
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
        });
    }

    min() {
        return this._deriveList((arr) => {
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
        });
    }

    sum() {
        return this._deriveList((arr) => {
            const list = Array.from(arr as any);
            let total = 0;
            let count = 0;
            for (const val of list) {
                const n = toValidNumber(val);
                if (n !== null) {
                    total += n;
                    count++;
                }
            }
            return count > 0 ? total : null;
        });
    }

    mean() {
        return this._deriveList((arr) => {
            const list = Array.from(arr as any);
            let total = 0;
            let count = 0;
            for (const val of list) {
                const n = toValidNumber(val);
                if (n !== null) {
                    total += n;
                    count++;
                }
            }
            return count > 0 ? total / count : null;
        });
    }

    get(index: number) {
        return this._deriveList((arr) => {
            const list = Array.from(arr as any);
            const idx = index < 0 ? list.length + index : index;
            if (idx < 0 || idx >= list.length) return null;
            const val = list[idx];
            return val !== undefined ? val : null;
        });
    }

    first() {
        return this.get(0);
    }

    last() {
        return this.get(-1);
    }

    contains(item: any) {
        return this._deriveList((arr) => {
            return Array.from(arr as any).includes(item);
        });
    }

    join(separator: string) {
        return this._deriveList((arr) => {
            return Array.from(arr as any).map(x => x == null ? "" : String(x)).join(separator);
        });
    }

    sort(descending: boolean = false) {
        return this._deriveList((arr) => {
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
        });
    }

    reverse() {
        return this._deriveList((arr) => {
            return Array.from(arr as any).reverse();
        });
    }

    unique() {
        return this._deriveList((arr) => {
            return Array.from(new Set(Array.from(arr as any)));
        });
    }

    slice(offset: number, length?: number) {
        return this._deriveList((arr) => {
            const list = Array.from(arr as any);
            const start = offset < 0 ? Math.max(0, list.length + offset) : offset;
            const end = length !== undefined ? start + length : list.length;
            return list.slice(start, end);
        });
    }

    count_matches(item: any) {
        return this._deriveList((arr) => {
            const list = Array.from(arr as any);
            let count = 0;
            for (const val of list) {
                if (val === item) {
                    count++;
                }
            }
            return count;
        });
    }
}

export const ListExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        get list() {
            return new ListExprNamespace(this);
        }
    };
};
