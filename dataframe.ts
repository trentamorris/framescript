

export type AggFn<V, R = any> = (values: V[]) => R;
export type OpFn = (val: any, row: any) => any;
export interface IExpr {
    ops: OpFn[];
    _resolve(val: any, row: any): any;
}
export type ExprConstructor = new (...args: any[]) => IExpr;
export type JoinType = "inner" | "left" | "outer"

/**
 * Applies Kleene Logic to operations.
 * @description In 3-valued logic, if an operand is null/undefined (Unknown)
 * the result of arithmetic remains Unknown to prevent data corruption.
 */
const kleene = (fn: (v: any, row: any) => any) => (v: any, row: any) => (v == null ? v : fn(v, row))

/** Handles Arithmetic Operations */
export const ArithmeticExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        ops: OpFn[] = (this as any).ops || []

        add(val: number | ColumnExpr<any>) {
            this.ops.push(kleene((v, row) => v + this._resolve(val, row)))
            return this
        }
        sub(val: number | ColumnExpr<any>) {
            this.ops.push(kleene((v, row) => v - this._resolve(val, row)))
            return this
        }
        mul(val: number | ColumnExpr<any>) {
            this.ops.push(kleene((v, row) => v * this._resolve(val, row)))
            return this
        }
        div(val: number | ColumnExpr<any>) {
            this.ops.push(kleene((v, row) => v / this._resolve(val, row)))
            return this
        }
        floordiv(val: number | ColumnExpr<any>) {
            this.ops.push(kleene((v, row) => Math.floor(v / this._resolve(val, row))))
            return this
        }
        mod(val: number | ColumnExpr<any>) {
            this.ops.push(kleene((v, row) => v % this._resolve(val, row)))
            return this
        }
        pow(val: number | ColumnExpr<any>) {
            this.ops.push(kleene((v, row) => Math.pow(v, this._resolve(val, row))))
            return this
        }
    }
}

/** Handles Comparison Operations */
export const ComparisonExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        ops: OpFn[] = (this as any).ops || []

        eq(val: any) {
            this.ops.push(kleene((v, row) => v === this._resolve(val, row)))
            return this
        }
        ne(val: any) {
            this.ops.push(kleene((v, row) => v !== this._resolve(val, row)))
            return this
        }
        gt(val: any) {
            this.ops.push(kleene((v, row) => v > this._resolve(val, row)))
            return this
        }
        ge(val: any) {
            this.ops.push(kleene((v, row) => v >= this._resolve(val, row)))
            return this
        }
        lt(val: any) {
            this.ops.push(kleene((v, row) => v < this._resolve(val, row)))
            return this
        }
        le(val: any) {
            this.ops.push(kleene((v, row) => v <= this._resolve(val, row)))
            return this
        }
        is_in(values: any[]) {
            const valuesSet = new Set(values)
            this.ops.push(kleene((v, _row) => valuesSet.has(v)))
            return this
        }
        not_in(values: any[]) {
            const valuesSet = new Set(values)
            this.ops.push(kleene((v, _row) => !valuesSet.has(v)))
            return this
        }
        is_null() {
            this.ops.push((v, _row) => v == null)
            return this
        }
        is_not_null() {
            this.ops.push((v, _row) => v != null)
            return this
        }
    }
}

export const AggregationExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        public aggFn: AggFn<any> | null = null

        sum() {
            this.aggFn = (v: any[]) => {
                const filtered = v.filter(x => x != null)
                return filtered.length ? filtered.reduce((a, b) => a + b, 0) : null
            }
            return this
        }
        avg() {
            this.aggFn = (v: number[]) => {
                const filtered = v.filter(x => x != null)
                return filtered.length ? filtered.reduce((a, b) => a + b, 0) / filtered.length : null
            }
            return this
        }
        min() {
            this.aggFn = (v: any[]) => {
                const filtered = v.filter(x => x != null)
                return filtered.length ? filtered.reduce((m, c) => (c < m ? c : m)) : null
            }
            return this
        }
        max() {
            this.aggFn = (v: any[]) => {
                const filtered = v.filter(x => x != null)
                return filtered.length ? filtered.reduce((m, c) => (c > m ? c : m)) : null
            }
            return this 
        }
        count() {
            this.aggFn = (v: any[]) => v.length
            return this
        }
        uniqueCount() {
            this.aggFn = (v: any[]) => new Set(v).size
            return this
        }
        first() {
            this.aggFn = (v: any[]) => v[0]
            return this
        }
    }
}

export class ExprBase {
    public ops: OpFn[] = []
    public outputName: string = ""

    public _resolve(val: any | ColumnExpr<any>, row: any) {
        return val instanceof ColumnExpr ? val.evaluate(row) : val
    }
    
    alias(name: string) {
        this.outputName = name
        return this
    }
}

export class ColumnExpr<T> extends AggregationExpr(ComparisonExpr(ArithmeticExpr(ExprBase))) {
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
        const map = mapping instanceof Map ? mapping : new Map(Object.entries(mapping))
        this.ops.push((currentValue) => {
            if (map.has(currentValue)) return map.get(currentValue)
            return defaultValue !== undefined ? defaultValue : currentValue
        })
        return this
    }
}


export class AllColumnsExpr extends AggregationExpr(ComparisonExpr(ArithmeticExpr(ExprBase))) {

    evaluate(row: any): any {
        let value = row
        for (const op of this.ops) {
            value = op(value, row)
        }
        return value
    }
}


export class GroupedData<T, K extends keyof T> {
    private groups: Map<string, T[]>
    private keys: K[]
    private allKeys: (keyof T)[]


    constructor(groups: Map<string, T[]>, keys: K[], allKeys: (keyof T)[]) {
        this.groups = groups
        this.keys = keys
        this.allKeys = allKeys
    }

    collect(): T[] {
        return Array.from(this.groups.values()).map(groupRows => {
            const row: any = {}
            this.keys.forEach(k => (row[k] = groupRows[0][k]))
            return row as T
        })
    }

    agg(...exprs: (ColumnExpr<T> | AllColumnsExpr)[]): DataFrame<T> {
        const finalExprs: ColumnExpr<T>[] = []

        for (const expr of exprs) {
            if (expr instanceof AllColumnsExpr) {
                for (const key of this.allKeys) {
                    if (!this.keys.includes(key as K)) {
                        const e = new ColumnExpr<T>(key)
                        if (expr.aggFn) e.aggFn = expr.aggFn
                        finalExprs.push(e)
                    }
                }
            } else {
                finalExprs.push(expr)
            }
        }

        const results = Array.from(this.groups.values()).map(rows => {
            const row = {} as any
            for (const k of this.keys) row[k] = rows[0][k]
            for (const e of finalExprs) {
                const activeFn = e.aggFn || ((v: any[]) => v[0])
                const values = rows.map(r => e.evaluate(r))
                row[e.outputName] = activeFn(values)
            }
            return row
        })

        return new DataFrame(results)
    }
}



export class DataFrame<T> {
    private data: T[]

    constructor(data: T[]) {
        this.data = data
    }

    collect(): T[] {
        return this.data
    }

    to_list<K extends keyof T>(name: K): T[K][] {
        const len = this.data.length
        const list = new Array(len)
        for (let i = 0; i < len; i++) {
            list[i] = this.data[i][name]
        }
        return list
    }

    select<U extends Record<string, any> = any>(...exprs: (string | ColumnExpr<T>)[]): DataFrame<U> {
        const newRows = this.data.map(row => {
            const newRow: Record<string, any> = {}
            for (const expr of exprs) {
                if (typeof expr === "string") {
                    newRow[expr] = (row as any)[expr]
                } else {
                    const colName = expr.outputName || expr.colName
                    newRow[colName] = expr.evaluate(row)
                }
            }
            return newRow
        })
        return new DataFrame(newRows as U[])
    }

    drop<K extends keyof T>(...columns: K[]): DataFrame<Omit<T, K>> {
        const columnsToDrop = new Set(columns as string[])
        const newRows = this.data.map(row => {
            const newRow = { ...row }
            for (const col of columnsToDrop) {
                delete (newRow as any)[col]
            }
            return newRow
        })
        return new DataFrame(newRows as Omit<T, K>[])
    }

    with_columns<U extends Record<string, any>>(struct: Record<string, ColumnExpr<T>>): DataFrame<T & U> {
        const len = this.data.length
        const newRows = new Array(len)
        const exprEntries = Object.entries(struct)

        for (let i = 0; i < len; i++) {
            const row = this.data[i]
            const updatedRow: any = { ...row }

            for (let j = 0; j < exprEntries.length; j++) {
                const [newName, expr] = exprEntries[j]
                updatedRow[newName] = expr.evaluate(row)
            }
            newRows[i] = updatedRow
        }

        return new DataFrame(newRows)
    }

    filter(...exprs: ColumnExpr<any>[]): DataFrame<T> {
        return new DataFrame(this.data.filter(row => 
            exprs.every(expr => expr.evaluate(row) === true)
        ))
    }
 
    sort(config: {
        by: keyof T | (keyof T)[] | ColumnExpr<T> | ColumnExpr<T>[]
        descending?: boolean | boolean[]
        nullsLast?: boolean
        custom?: Partial<Record<keyof T, (a: any, b: any) => number>>
    }): DataFrame<T> {
        const { by, descending = false, nullsLast = true } = config
        const sortKeys = Array.isArray(by) ? by : [by]
        const descArray = Array.isArray(descending) ? descending : new Array(sortKeys.length).fill(descending)

        const sorted = [...this.data].sort((a, b) => {
            for (let i = 0; i < sortKeys.length; i++) {
                const keyOrExpr = sortKeys[i]
                const isDesc = descArray[i]

                const vA = keyOrExpr instanceof ColumnExpr ? keyOrExpr.evaluate(a) : (a as any)[keyOrExpr];
                const vB = keyOrExpr instanceof ColumnExpr ? keyOrExpr.evaluate(b) : (b as any)[keyOrExpr];
                
                if (vA == null || vB == null) {
                    if (vA == vB) continue
                    return (nullsLast ? 1 : -1) * (vA == null ? 1 : -1)
                }

                if (vA < vB) return isDesc ? 1 : -1
                if (vA > vB) return isDesc ? -1 : 1
            }
            return 0
        })

        return new DataFrame(sorted)
    }


    groupby<K extends keyof T>(keys: K[]): GroupedData<T, K> {
        const groups = new Map<string, T[]>()
        const len = this.data.length
        const kLen = keys.length
        const firstRow = this.data[0] || {}
        const allKeys = Object.keys(firstRow) as (keyof T)[]

        for (let i = 0; i < len; i++) {
            const item = this.data[i]

           let hash = "";
            for (let j = 0; j < kLen; j++) {
                hash += String((item as any)[keys[j]]) + "|$|"; 
            }

            const existing = groups.get(hash)
            if (existing) {
                existing.push(item)
            } else {
                groups.set(hash, [item])
            }
        }

        return new GroupedData(groups, keys, allKeys)
    }

   join<U>(
        other: DataFrame<U>,
        on: keyof T & keyof U | (keyof T & keyof U)[],
        how: JoinType = "inner",
        suffixes: [string, string] = ["", "_right"]
    ): DataFrame<any> {
        const leftData = this.data;
        const rightData = other.collect();
        const joinKeys = Array.isArray(on) ? on : [on];
        const joinKeysSet = new Set(joinKeys as string[]);
        const [leftSuffix, rightSuffix] = suffixes;

        const leftKeys = Object.keys(leftData[0] || {});
        const rightKeys = Object.keys(rightData[0] || {});
        const rightKeySet = new Set(rightKeys);

        const leftRenameMap: Record<string, string> = {};
        for (const k of leftKeys) {
            leftRenameMap[k] = (rightKeySet.has(k) && !joinKeysSet.has(k)) ? `${k}${leftSuffix}` : k;
        }

        const rightRenameMap: Record<string, string> = {};
        const leftKeySet = new Set(leftKeys);
        for (const k of rightKeys) {
            rightRenameMap[k] = (leftKeySet.has(k) && !joinKeysSet.has(k)) ? `${k}${rightSuffix}` : k;
        }

        const rightHash = new Map<string, U[]>();
        const isSingleKey = joinKeys.length === 1;
        const singleK = joinKeys[0];

        for (let i = 0; i < rightData.length; i++) {
            const rRow = rightData[i];
            const hash = isSingleKey ? String((rRow as any)[singleK]) : joinKeys.map(k => String((rRow as any)[k])).join("|$|");
            let group = rightHash.get(hash);
            if (!group) { group = []; rightHash.set(hash, group); }
            group.push(rRow);
        }

        const result: any[] = [];

        for (let i = 0; i < leftData.length; i++) {
            const lRow = leftData[i];
            const hash = isSingleKey ? String((lRow as any)[singleK]) : joinKeys.map(k => String((lRow as any)[k])).join("|$|");
            const matches = rightHash.get(hash);

            if (matches) {
                for (let j = 0; j < matches.length; j++) {
                    const rRow = matches[j];
                    const merged: any = {};
                    for (const k in lRow) merged[leftRenameMap[k]] = lRow[k];
                    for (const k in rRow) if (!joinKeysSet.has(k)) merged[rightRenameMap[k]] = rRow[k];
                    result.push(merged);
                }
            } else if (how === "left" || how === "outer") {
                const merged: any = {};
                for (const k in lRow) merged[leftRenameMap[k]] = lRow[k];
                result.push(merged);
            }
        }

        return new DataFrame(result);
    }

    pivot (
        index: (keyof T)[],
        columns: keyof T,
        values: keyof T
    ): DataFrame<any> {
        const groups = new Map<string, any>()
        const colNames = new Set<string>()

        for (const row of this.data) {
            const rowKey = index.map(k => String(row[k])).join("|$|")
            const pivotColName = String(row[columns])
            const value = row[values]

            colNames.add(pivotColName)

            if (!groups.has(rowKey)) {
                const initialRow: any = {};
                index.forEach(k => initialRow[String(k)] = row[k]);
                groups.set(rowKey, initialRow);
            }

            groups.get(rowKey)[pivotColName] = value;
        }

        const result = Array.from(groups.values()).map(row => {
            for (const col of colNames) {
                if (!(col in row)) row[col] = null;
            }
            return row;
        });

        return new DataFrame(result);
    }


    unpivot(
        idVars: (keyof T)[],
        valueVars: (keyof T)[],
        varName: string = "variable",
        valueName: string = "value"
    ): DataFrame<any> {
        const result: any[] = []

        for (const row of this.data) {
            for (const vVar of valueVars) {
                const newRow: any = {}
                idVars.forEach(id => (newRow[String(id)] = row[id]))

                newRow[varName] = String(vVar)
                newRow[valueName] = row[vVar]

                result.push(newRow)
            }
        }

        return new DataFrame(result)
    }
}

export const $tbl = {
    data: <T extends Record<string, any>>(data: T[]) => new DataFrame(data),
    col: (name: string) => new ColumnExpr<any>(name),
    all: () => new AllColumnsExpr()
}