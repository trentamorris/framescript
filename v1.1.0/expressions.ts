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
        add(val: number | IExpr) { 
            return derive(this, kleene((v, row) => v + this._resolve(val, row))); 
        }
        sub(val: number | IExpr) { 
            return derive(this, kleene((v, row) => v - this._resolve(val, row))); 
        }
        mul(val: number | IExpr) { 
            return derive(this, kleene((v, row) => v * this._resolve(val, row))); 
        }
        div(val: number | IExpr) { 
            return derive(this, kleene((v, row) => v / this._resolve(val, row))); 
        }
        floordiv(val: number | IExpr) { 
            return derive(this, kleene((v, row) => Math.floor(v / this._resolve(val, row)))); 
        }
        mod(val: number | IExpr) { 
            return derive(this, kleene((v, row) => v % this._resolve(val, row))); 
        }
        pow(val: number | IExpr) { 
            return derive(this, kleene((v, row) => Math.pow(v, this._resolve(val, row)))); 
        }
    };
};

export const LogicalExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        and(other: IExpr) { 
            return derive(this, (v, row) => !!v && !!other.evaluate(row)); 
        }
        or(other: IExpr) { 
            return derive(this, (v, row) => !!v || !!other.evaluate(row)); 
        }
        xor(other: IExpr) {
            return derive(this, (v, row) => Number(!!v) ^ Number(!!other.evaluate(row)));
        }
        not () {
            return derive(this, (v) => !v);
        }
    }
}

/** Handles Comparison & Logical Operations */
export const ComparisonExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        eq(val: any) { 
            return derive(this, kleene((v, row) => v === this._resolve(val, row))); 
        }
        ne(val: any) { 
            return derive(this, kleene((v, row) => v !== this._resolve(val, row))); 
        }
        gt(val: any) { 
            return derive(this, kleene((v, row) => v > this._resolve(val, row))); 
        }
        ge(val: any) { 
            return derive(this, kleene((v, row) => v >= this._resolve(val, row))); 
        }
        lt(val: any) { 
            return derive(this, kleene((v, row) => v < this._resolve(val, row))); 
        }
        le(val: any) { 
            return derive(this, kleene((v, row) => v <= this._resolve(val, row))); 
        } 
        is_in(values: any[]) {
            const set = new Set(values);
            return derive(this, kleene((v) => set.has(v)));
        }
        not_in(values: any[]) {
            const set = new Set(values);
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
            return derive(this, kleene((v) => String(v).replace(pattern, replacement)));
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

        get isWindow(): boolean {
            return this.partitionBy !== null && (this as any).aggFn !== null;
        }

        over(columns: string | IExpr | (string | IExpr)[]) {
            const newInst = derive(this, (v) => v);
            const cols = Array.isArray(columns) ? columns : [columns];
            newInst.partitionBy = cols;
            return newInst;
        }
    }
}

export class ExprBase implements IExpr {
    public ops: OpFn[] = [];
    public outputName: string = "";

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
        //let value = (this as any).colName ? row[(this as any).colName] : row;
        /* for (const op of this.ops) {
            value = op(value, row);
        } */
        return value;
    }
}

export class ColumnExpr<T> extends WindowExpr(AggregationExpr(ComparisonExpr(ArithmeticExpr(ExprBase)))) {
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


export class AllColumnsExpr extends WindowExpr(AggregationExpr(ComparisonExpr(ArithmeticExpr(ExprBase)))) {
    constructor() {
        super();
        this.outputName = "*";
    }

    evaluate(row: any): any {
        let value = row;
        for (const op of this.ops) {
            value = op(value, row);
        }
        return value;
    }
}