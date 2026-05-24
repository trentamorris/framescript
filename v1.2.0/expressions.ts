import type { IExpr, OpFn, ExprConstructor, AggFn } from "./types"

/**
 * Applies Kleene Logic to operations.
 * @description In 3-valued logic, if an operand is null/undefined (Unknown)
 * the result of arithmetic remains Unknown to prevent data corruption.
 */
const kleene = (fn: (v: any, row: any) => any) => (v: any, row: any) => (v == null ? v : fn(v, row))

const derive = <T extends IExpr>(instance: T, nextOp: OpFn): T => {
    const Constructor = instance.constructor as any;
    const newInst = new Constructor((instance as any).colName || "");
    Object.assign(newInst, instance);
    newInst.ops = [...instance.ops, nextOp];
    return newInst;
};

/** Handles Arithmetic Operations */
export const ArithmeticExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        add(val: number | IExpr | null) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v + r;
            })); 
        }
        sub(val: number | IExpr | null) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v - r;
            })); 
        }
        mul(val: number | IExpr | null) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v * r;
            })); 
        }
        div(val: number | IExpr | null) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v / r;
            })); 
        }
        floordiv(val: number | IExpr | null) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : Math.floor(v / r);
            })); 
        }
        mod(val: number | IExpr | null) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v % r;
            })); 
        }
        pow(val: number | IExpr | null) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : Math.pow(v, r);
            })); 
        }
    };
};

export const LogicalExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        and(other: IExpr) { 
            return derive(this, (v, row) => {
                const w = other.evaluate(row);
                if (v === false || w === false) return false;
                if (v == null || w == null) return null;
                return true;
            }); 
        }
        or(other: IExpr) { 
            return derive(this, (v, row) => {
                const w = other.evaluate(row);
                if (v === true || w === true) return true;
                if (v == null || w == null) return null;
                return false;
            }); 
        }
        xor(other: IExpr) {
            return derive(this, (v, row) => {
                const w = other.evaluate(row);
                if (v == null || w == null) return null;
                return Number(!!v) ^ Number(!!w);
            });
        }
        not () {
            return derive(this, (v) => (v == null ? null : !v));
        }
    }
}

/** Handles Comparison & Logical Operations */
export const ComparisonExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        eq(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v === r;
            })); 
        }
        ne(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v !== r;
            })); 
        }
        gt(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v > r;
            })); 
        }
        ge(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v >= r;
            })); 
        }
        lt(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v < r;
            })); 
        }
        le(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v <= r;
            })); 
        } 
        is_in(values: any[]) {
            const arr = Array.isArray(values) ? values : [];
            const set = new Set(arr);
            return derive(this, kleene((v) => set.has(v)));
        }
        not_in(values: any[]) {
            const arr = Array.isArray(values) ? values : [];
            const set = new Set(arr);
            return derive(this, kleene((v) => !set.has(v)));
        }
        is_null() { 
            return derive(this, (v) => v == null); 
        }
        is_not_null() { 
            return derive(this, (v) => v != null); 
        }
        is_nan() {
            return derive(this, kleene((v) => Number.isNaN(v)));
        }
        is_not_nan() {
            return derive(this, kleene((v) => !Number.isNaN(v)));
        }
        is_finite() {
            return derive(this, kleene((v) => Number.isFinite(v)));
        }
        is_infinite() {
            return derive(this, kleene((v) => v === Infinity || v === -Infinity));
        }
    }
}

export const StringExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        concat(other: string | IExpr) {
            return derive(this, kleene((v, row) => {
                const otherVal = (this as any)._resolve(other, row);
                if (otherVal == null) return null;
                return String(v) + String(otherVal);
            }));
        }
        contains(pattern: string | RegExp) {
            if (pattern == null) {
                return derive(this, () => null);
            }
            return derive(this, kleene((v) => {
                const str = String(v);
                return pattern instanceof RegExp ? pattern.test(str) : str.includes(pattern);
            }));
        }
        ends_with(suffix: string) {
            return derive(this, kleene((v) => String(v).endsWith(suffix)));
        }
        len() {
            return derive(this, kleene((v) => String(v).length));
        }
        lower() {
            return derive(this, kleene((v) => String(v).toLowerCase()));
        }
        lpad(width: number, fill: string = " ") {
            return derive(this, kleene((v) => String(v).padStart(width, fill)));
        }
        replace_all(pattern: string | RegExp, replacement: string) {
            if (pattern == null) {
                return derive(this, () => null);
            }
            return derive(this, kleene((v) => {
                const str = String(v);
                if (pattern instanceof RegExp) {
                    const regex = pattern.global 
                        ? pattern 
                        : new RegExp(pattern.source, pattern.flags + "g");
                    return str.replace(regex, replacement);
                }
                return str.replaceAll(pattern, replacement);
            }));
        }
        rpad(width: number, fill: string = " ") {
            return derive(this, kleene((v) => String(v).padEnd(width, fill)));
        }
        slice_str(start: number, end?: number) {
            return derive(this, kleene((v) => String(v).slice(start, end)));
        }
        split(delimiter: string) {
            return derive(this, kleene((v) => String(v).split(delimiter)));
        }
        starts_with(prefix: string) {
            return derive(this, kleene((v) => String(v).startsWith(prefix)));
        }
        trim() {
            return derive(this, kleene((v) => String(v).trim()));
        }
        upper() {
            return derive(this, kleene((v) => String(v).toUpperCase()));
        }
        zfill(width: number) {
            return derive(this, kleene((v) => String(v).padStart(width, "0")));
        }
    };
};

/** Handles Aggregation Operations */
export const AggregationExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        public aggFn: AggFn<any> | null = (this as any).aggFn || null;
        private _setAgg(fn: AggFn<any>) {
            const newInst = derive(this, (v) => v);
            newInst.aggFn = fn;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.partitionOpsIndex = this.ops.length;
            return newInst;
        }

        sum() { 
            return this._setAgg(v => {
                const f = v.filter(x => x != null);
                return f.length ? f.reduce((a, b) => a + b, 0) : null;
            });
        }
        avg() { 
            return this._setAgg(v => {
                const f = v.filter(x => x != null);
                return f.length ? f.reduce((a, b) => a + b, 0) / f.length : null;
            }); 
        }
        min() {
            return this._setAgg(v => {
                const f = v.filter(x => x != null);
                return f.length ? f.reduce((a, b) => (a < b ? a : b)) : null;
            });
        }
        max() {
            return this._setAgg(v => {
                const f = v.filter(x => x != null);
                return f.length ? f.reduce((a, b) => (a > b ? a : b)) : null;
            });
        }
        mean() {
            return this.avg();
        }
        median() {
            return this._setAgg(v => {
                const f = v.filter(x => x != null).sort((a, b) => a - b)
                const fLen = f.length
                if (!fLen) return null
                const mid = Math.floor(fLen / 2)
                return fLen % 2 !== 0 ? f[mid] : (f[mid - 1] + f[mid]) / 2;
            })
        }
        mode() {
            return this._setAgg(v => {
                const f = v.filter(x => x != null);
                const fLen = f.length;
                if (!fLen) return null;
                const counts = new Map();
                let maxCount = 0;
                let modeVal = f[0];
                for (const val of f) {
                    const count = (counts.get(val) || 0) + 1;
                    counts.set(val, count)
                    if (count > maxCount) {
                        maxCount = count;
                        modeVal = val;
                    }
                }
                return modeVal
            })
        }
        std() {
            return this._setAgg(v => {
                const f = v.filter(x => x != null);
                const fLen = f.length
                if (fLen < 2) return 0;
                const mean = f.reduce((a, b) => a + b, 0) / fLen;
                const variance = f.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (fLen - 1);
                return Math.sqrt(variance)
            })
        }
        count() { 
            return this._setAgg(v => v.length); 
        }
        uniqueCount() {
            return this._setAgg(v => new Set(v).size)
        }
        first() {
            return this._setAgg(v => v[0])
        }
        last() {
            return this._setAgg(v => v[v.length - 1])
        }
        any() {
            return this._setAgg(v => v.some(x => !!x));
        }
        all() {
            return this._setAgg(v => v.every(x => !!x));
        }
        any_null() {
            return this._setAgg(v => v.some(x => x === null));
        }
        all_null() {
            return this._setAgg(v => v.every(x => x == null));
        }
    }
}

/** Handles Window/Partitioning Operations */
export const WindowExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        public partitionBy: (string | IExpr)[] | null = (this as any).partitionBy || null;

        private _rolling(windowSize: number, aggFn: (vals: any[]) => any) {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                const start = Math.max(0, currentIndex - windowSize + 1);
                const end = currentIndex + 1;
                const windowRows = partitionRows.slice(start, end);
                const preValues = windowRows.map(r => this.evaluatePrePartition(r));
                const resultVal = aggFn(preValues);
                return this.evaluatePostPartition(resultVal, partitionRows[currentIndex]);
            };
            return newInst;
        }

        get isWindow(): boolean {
            return this.partitionBy !== null || (this as any).evaluateWindow !== undefined || (this as any).aggFn !== null;
        }

        over(columns: string | IExpr | (string | IExpr)[]) {
            const newInst = derive(this, (v) => v);
            const cols = Array.isArray(columns) ? columns : [columns];
            newInst.partitionBy = cols;
            return newInst;
        }

        lag(offset: number = 1, defaultVal: any = null) {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                let val = defaultVal;
                if (currentIndex - offset >= 0) {
                    const sourceRow = partitionRows[currentIndex - offset];
                    val = this.evaluatePrePartition(sourceRow);
                }
                return this.evaluatePostPartition(val, partitionRows[currentIndex]);
            };
            return newInst;
        }

        lead(offset: number = 1, defaultVal: any = null) {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                let val = defaultVal;
                if (currentIndex + offset < partitionRows.length) {
                    const sourceRow = partitionRows[currentIndex + offset];
                    val = this.evaluatePrePartition(sourceRow);
                }
                return this.evaluatePostPartition(val, partitionRows[currentIndex]);
            };
            return newInst;
        }

        row_number() {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                const val = currentIndex + 1;
                return this.evaluatePostPartition(val, partitionRows[currentIndex]);
            };
            newInst.outputName = "row_number";
            return newInst;
        }

        rank() {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                const vals = partitionRows.map(r => this.evaluatePrePartition(r));
                const sorted = [...vals].sort((a, b) => a - b);
                const valueToRank = new Map();
                for (let i = 0; i < sorted.length; i++) {
                    const v = sorted[i];
                    if (!valueToRank.has(v)) {
                        valueToRank.set(v, i + 1);
                    }
                }
                const currentVal = this.evaluatePrePartition(partitionRows[currentIndex]);
                const rankVal = valueToRank.get(currentVal) ?? null;
                return this.evaluatePostPartition(rankVal, partitionRows[currentIndex]);
            };
            return newInst;
        }

        dense_rank() {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                const vals = partitionRows.map(r => this.evaluatePrePartition(r));
                const sortedUnique = Array.from(new Set(vals)).sort((a, b) => a - b);
                const valueToRank = new Map(sortedUnique.map((v, idx) => [v, idx + 1]));
                const currentVal = this.evaluatePrePartition(partitionRows[currentIndex]);
                const rankVal = valueToRank.get(currentVal) ?? null;
                return this.evaluatePostPartition(rankVal, partitionRows[currentIndex]);
            };
            return newInst;
        }

        cum_sum(reverse: boolean = false) {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                let sum = 0;
                const start = reverse ? currentIndex : 0;
                const end = reverse ? partitionRows.length - 1 : currentIndex;
                for (let i = start; i <= end; i++) {
                    const val = this.evaluatePrePartition(partitionRows[i]);
                    if (val != null) sum += val;
                }
                return this.evaluatePostPartition(sum, partitionRows[currentIndex]);
            };
            return newInst;
        }

        cum_prod(reverse: boolean = false) {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                let prod = 1;
                let hasValid = false;
                const start = reverse ? currentIndex : 0;
                const end = reverse ? partitionRows.length - 1 : currentIndex;
                for (let i = start; i <= end; i++) {
                    const val = this.evaluatePrePartition(partitionRows[i]);
                    if (val != null) {
                        prod *= val;
                        hasValid = true;
                    }
                }
                const finalVal = hasValid ? prod : null;
                return this.evaluatePostPartition(finalVal, partitionRows[currentIndex]);
            };
            return newInst;
        }

        cum_min(reverse: boolean = false) {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                let minVal = null;
                const start = reverse ? currentIndex : 0;
                const end = reverse ? partitionRows.length - 1 : currentIndex;
                for (let i = start; i <= end; i++) {
                    const val = this.evaluatePrePartition(partitionRows[i]);
                    if (val != null) {
                        if (minVal === null || val < minVal) {
                            minVal = val;
                        }
                    }
                }
                return this.evaluatePostPartition(minVal, partitionRows[currentIndex]);
            };
            return newInst;
        }

        cum_max(reverse: boolean = false) {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                let maxVal = null;
                const start = reverse ? currentIndex : 0;
                const end = reverse ? partitionRows.length - 1 : currentIndex;
                for (let i = start; i <= end; i++) {
                    const val = this.evaluatePrePartition(partitionRows[i]);
                    if (val != null) {
                        if (maxVal === null || val > maxVal) {
                            maxVal = val;
                        }
                    }
                }
                return this.evaluatePostPartition(maxVal, partitionRows[currentIndex]);
            };
            return newInst;
        }

        cum_count(reverse: boolean = false) {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                let count = 0;
                const start = reverse ? currentIndex : 0;
                const end = reverse ? partitionRows.length - 1 : currentIndex;
                for (let i = start; i <= end; i++) {
                    const val = this.evaluatePrePartition(partitionRows[i]);
                    if (val != null) count++;
                }
                return this.evaluatePostPartition(count, partitionRows[currentIndex]);
            };
            return newInst;
        }

        rolling_sum(windowSize: number) {
            return this._rolling(windowSize, v => {
                const f = v.filter(x => x != null);
                return f.length ? f.reduce((a, b) => a + b, 0) : null;
            });
        }

        rolling_mean(windowSize: number) {
            return this._rolling(windowSize, v => {
                const f = v.filter(x => x != null);
                return f.length ? f.reduce((a, b) => a + b, 0) / f.length : null;
            });
        }

        rolling_min(windowSize: number) {
            return this._rolling(windowSize, v => {
                const f = v.filter(x => x != null);
                return f.length ? f.reduce((a, b) => (a < b ? a : b)) : null;
            });
        }

        rolling_max(windowSize: number) {
            return this._rolling(windowSize, v => {
                const f = v.filter(x => x != null);
                return f.length ? f.reduce((a, b) => (a > b ? a : b)) : null;
            });
        }

        rolling_median(windowSize: number) {
            return this._rolling(windowSize, v => {
                const f = v.filter(x => x != null).sort((a, b) => a - b);
                if (!f.length) return null;
                const mid = Math.floor(f.length / 2);
                return f.length % 2 !== 0 ? f[mid] : (f[mid - 1] + f[mid]) / 2;
            });
        }

        rolling_std(windowSize: number) {
            return this._rolling(windowSize, v => {
                const f = v.filter(x => x != null);
                if (f.length < 2) return 0;
                const mean = f.reduce((a, b) => a + b, 0) / f.length;
                const variance = f.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (f.length - 1);
                return Math.sqrt(variance);
            });
        }

        rolling_quantile(quantile: number, windowSize: number) {
            return this._rolling(windowSize, v => {
                const f = v.filter(x => x != null).sort((a, b) => a - b);
                const n = f.length;
                if (n === 0) return null;
                const idx = quantile * (n - 1);
                const low = Math.floor(idx);
                const high = Math.ceil(idx);
                if (low === high) return f[low];
                return f[low] + (idx - low) * (f[high] - f[low]);
            });
        }

        rolling_rank(windowSize: number) {
            const newInst = derive(this, (v) => v);
            newInst.partitionOpsIndex = this.ops.length;
            newInst.groupingOpsIndex = this.ops.length;
            newInst.evaluateWindow = function(this: IExpr, partitionRows: any[], partitionIndices: number[], currentIndex: number) {
                const start = Math.max(0, currentIndex - windowSize + 1);
                const end = currentIndex + 1;
                const windowRows = partitionRows.slice(start, end);
                const vals = windowRows.map(r => this.evaluatePrePartition(r));
                const currentVal = this.evaluatePrePartition(partitionRows[currentIndex]);
                if (currentVal == null) {
                    return this.evaluatePostPartition(null, partitionRows[currentIndex]);
                }
                const nonNullVals = vals.filter(x => x != null);
                if (nonNullVals.length === 0) {
                    return this.evaluatePostPartition(null, partitionRows[currentIndex]);
                }
                const sorted = [...nonNullVals].sort((a, b) => a - b);
                const valueToRank = new Map();
                for (let i = 0; i < sorted.length; i++) {
                    const v = sorted[i];
                    if (!valueToRank.has(v)) {
                        valueToRank.set(v, i + 1);
                    }
                }
                const rankVal = valueToRank.get(currentVal) ?? null;
                return this.evaluatePostPartition(rankVal, partitionRows[currentIndex]);
            };
            return newInst;
        }
    }
}

export class ExprBase implements IExpr {
    public ops: OpFn[] = [];
    public outputName: string = "";
    public aggFn?: AggFn<any> | null = null;
    public groupingOpsIndex?: number;
    public partitionOpsIndex?: number;
    public partitionBy: (string | IExpr)[] | null = null;

    public _resolve(val: any, row: any) {
        return val?.evaluate ? val.evaluate(row) : val 
    }

    alias(name: string): this {
        const newInst = derive(this, (v) => v);
        newInst.outputName = name;
        return newInst;
    }

    evaluate(row: any): any {
        const name = (this as any).colName
        let value = name ? row[name] : row;

        const ops = this.ops;
        const len = ops.length;
        for (let i = 0; i < len; i++) {
            value = ops[i](value, row);
        }
        return value;
    }

    private _evaluatePre(opsIndex: number | undefined, row: any): any {
        const name = (this as any).colName;
        let value = name && name !== "*" ? row[name] : row;
        const ops = this.ops;
        const idx = opsIndex !== undefined ? opsIndex : ops.length;
        for (let i = 0; i < idx; i++) {
            value = ops[i](value, row);
        }
        return value;
    }

    private _evaluatePost(opsIndex: number | undefined, aggregatedValue: any, row: any): any {
        const ops = this.ops;
        const idx = opsIndex !== undefined ? opsIndex : ops.length;
        let value = aggregatedValue;
        for (let i = idx; i < ops.length; i++) {
            value = ops[i](value, row);
        }
        return value;
    }

    evaluatePrePartition(row: any): any {
        return this._evaluatePre(this.partitionOpsIndex, row);
    }

    evaluatePostPartition(aggregatedValue: any, row: any): any {
        return this._evaluatePost(this.partitionOpsIndex, aggregatedValue, row);
    }

    evaluatePreGrouping(row: any): any {
        return this._evaluatePre(this.groupingOpsIndex, row);
    }

    evaluatePostGrouping(aggregatedValue: any, row: any): any {
        return this._evaluatePost(this.groupingOpsIndex, aggregatedValue, row);
    }

    evaluateWindow(partitionRows: any[], partitionIndices: number[], currentIndex: number): any {
        if (this.aggFn) {
            const preValues = partitionRows.map(r => this.evaluatePrePartition(r));
            const aggregated = this.aggFn(preValues);
            return this.evaluatePostPartition(aggregated, partitionRows[currentIndex]);
        }
        return this.evaluate(partitionRows[currentIndex]);
    }
}

export class ColumnExpr<T> extends LogicalExpr(StringExpr(WindowExpr(AggregationExpr(ComparisonExpr(ArithmeticExpr(ExprBase)))))) {
    public colName: string

    constructor(colName: keyof T | string) {
        super()
        this.colName = String(colName)
        this.outputName = this.colName
    }

    evaluate(row: T): any {
        let value = (row as any)[this.colName]
        for (const op of this.ops) {
            value = op(value, row)
        }
        return value
    }

    replace(mapping: Map<any, any> | Record<string | number, any>, defaultValue?: any): this {
        const map = mapping instanceof Map ? mapping : new Map(Object.entries(mapping));
        return derive(this, (currentValue) => {
            if (map.has(currentValue)) return map.get(currentValue);
            return defaultValue !== undefined ? defaultValue : currentValue;
        });
    }
}


export class AllColumnsExpr extends LogicalExpr(StringExpr(WindowExpr(AggregationExpr(ComparisonExpr(ArithmeticExpr(ExprBase)))))) {
    public excludedCols: string[] = [];

    constructor() {
        super();
        this.outputName = "*";
    }

    exclude(columns: string | string[]): this {
        const newInst = derive(this, (v) => v);
        const cols = Array.isArray(columns) ? columns : [columns];
        newInst.excludedCols = [...this.excludedCols, ...cols];
        return newInst;
    }

    evaluate(row: any): any {
        let value = row;
        for (const op of this.ops) {
            value = op(value, row);
        }
        return value;
    }
}

export function resolveColumnSelectors(
    exprs: any[],
    allKeys: string[],
    keysToExcludeFromAll?: string[]
): IExpr[] {
    const expanded: IExpr[] = [];
    const excludeSet = keysToExcludeFromAll ? new Set(keysToExcludeFromAll) : new Set<string>();

    for (const expr of exprs) {
        if (typeof expr === "string") {
            expanded.push(new ColumnExpr(expr));
        } else if (expr instanceof AllColumnsExpr) {
            const excluded = new Set(expr.excludedCols);
            for (const key of allKeys) {
                if (!excludeSet.has(key) && !excluded.has(key)) {
                    const concrete = new ColumnExpr(key);
                    concrete.ops = [...expr.ops];
                    concrete.aggFn = expr.aggFn;
                    concrete.partitionOpsIndex = expr.partitionOpsIndex;
                    concrete.groupingOpsIndex = expr.groupingOpsIndex;
                    concrete.partitionBy = expr.partitionBy;
                    if (expr.evaluateWindow) {
                        concrete.evaluateWindow = expr.evaluateWindow;
                    }
                    if (expr.outputName && expr.outputName !== "*") {
                        concrete.outputName = expr.outputName;
                    }
                    expanded.push(concrete);
                }
            }
        } else if (expr && typeof expr === 'object' && 'evaluate' in expr && !expr.colName) {
            // Anonymous/base expressions (e.g. $tbl.mean() with no column specified) target all columns by default.
            for (const key of allKeys) {
                if (!excludeSet.has(key)) {
                    const concrete = new ColumnExpr(key);
                    concrete.ops = [...expr.ops];
                    concrete.aggFn = expr.aggFn;
                    concrete.groupingOpsIndex = expr.groupingOpsIndex;
                    concrete.partitionOpsIndex = expr.partitionOpsIndex;
                    expanded.push(concrete);
                }
            }
        } else {
            expanded.push(expr);
        }
    }
    return expanded;
}