import { AllColumnsExpr } from "./expressions"
import { GroupedData } from "./grouped"
import type { JoinType, IExpr, LimitPosition, ConcatOptions } from "./types"


export class DataFrame<T> {
    private data: T[]

    constructor(data: T[]) {
        this.data = data
    }

    collect(): T[] {
        return this.data
    }

    concat<U = any>(
        items: DataFrame<any>[],
        options: ConcatOptions = {}
    ): DataFrame<U> {
        const { how = 'vertical' } = options;

        if (items.length === 0) return new DataFrame<U>([]);
        if (items.length === 1 && how !== 'horizontal') return items[0] as unknown as DataFrame<U>;

        const collected = items.map(df => df.collect());

        switch (how) {
            case 'vertical': {
                const firstValid = collected.find(arr => arr.length > 0);
                if (!firstValid) return new DataFrame<U>([]);

                const firstKeys = Object.keys(firstValid[0]);

                for (let i = 0; i < collected.length; i++) {
                    const currentData = collected[i];
                    if (currentData.length === 0) continue;

                    const currentKeys = Object.keys(currentData[0]);

                    if (firstKeys.length !== currentKeys.length) {
                        throw new Error(`[Strict Vertical] Column count mismatch at index ${i}.`);
                    }
                    for (let j = 0; j < firstKeys.length; j++) {
                        if (firstKeys[j] !== currentKeys[j]) {
                            throw new Error(
                                `[Strict Vertical] Schema mismatch at position ${j} in DF ${i}. ` +
                                `Expected column "${firstKeys[j]}", but found "${currentKeys[j]}".`
                            );
                        }
                    }
                }

                return new DataFrame<U>(collected.flat());
            }

            case 'horizontal': {
                const firstLen = collected[0].length;
                const allColNames = new Set<string>();

                for (const arr of collected) {
                    if (arr.length !== firstLen) {
                        throw new Error(`[Horizontal] Row count mismatch at index ${collected.indexOf(arr)}. Expected ${firstLen}, got ${arr.length}.`);
                    }

                    if (arr.length > 0) {
                        for (const key of Object.keys(arr[0])) {
                            if (allColNames.has(key)) {
                                throw new Error(`[Horizontal] Duplicate column name "${key}" detected. Horizontal concat requires unique names.`);
                            }
                            allColNames.add(key);
                        }
                    }
                }

                const combinedData = new Array(firstLen);
                for (let i = 0; i < firstLen; i++) {
                    const mergedRow: any = {};
                    for (let k = 0; k < collected.length; k++) {
                        Object.assign(mergedRow, collected[k][i]);
                    }
                    combinedData[i] = mergedRow;
                }

                return new DataFrame<U>(combinedData);
            };

            case 'diagonal': {
                const allColumnsSet = new Set<string>();
                for (const arr of collected) {
                    if (arr.length > 0) {
                        Object.keys(arr[0]).forEach(k => allColumnsSet.add(k));
                    }
                }

                const allColumns = Array.from(allColumnsSet);
                const combinedData = collected.flatMap(arr =>
                    arr.map(row => {
                        const normalized: any = {};
                        for (const col of allColumns) {
                            const val = row[col];
                            normalized[col] = val !== undefined ? val : null;
                        }
                        return normalized;
                    })
                );
                return new DataFrame<U>(combinedData);
            };
        }
    }

    drop<K extends keyof T>(...args: (K | K[])[]): DataFrame<Omit<T, K>> {
        const data = this.data;
        const len = data.length;

        if (len === 0) return new DataFrame<Omit<T, K>>([]);

        const columnsToDrop = new Set(args.flat() as string[]);
        const keysToKeep = Object.keys(data[0] as object).filter(k => !columnsToDrop.has(k));
        const keysLen = keysToKeep.length;

        const newRows = new Array(len);

        for (let i = 0; i < len; i++) {
            const row = data[i] as any;
            const newRow: any = {};
            for (let j = 0; j < keysLen; j++) {
                const k = keysToKeep[j];
                newRow[k] = row[k];
            }
            newRows[i] = newRow;
        }

        return new DataFrame<Omit<T, K>>(newRows);
    }

    filter(...exprs: (IExpr | ((row: T) => any))[]): DataFrame<T> {
        const data = this.data;
        const len = data.length;

        const predicates = exprs.map(expr =>
            typeof expr === "function" ? expr : (row: T) => expr.evaluate(row)
        );
        const predLen = predicates.length;

        const filteredData: T[] = [];
        for (let i = 0; i < len; i++) {
            const row = data[i];
            let keep = true;

            for (let j = 0; j < predLen; j++) {
                if (!predicates[j](row)) {
                    keep = false;
                    break;
                }
            }

            if (keep) {
                filteredData.push(row);
            }
        }

        return new DataFrame(filteredData);
    }

    groupby<K extends keyof T>(keys: K[]): GroupedData<T, K> {
        const groups = new Map<any, T[]>();
        const data = this.data;
        const len = data.length;
        const kLen = keys.length;

        const firstRow = data[0];
        const allKeys = firstRow ? (Object.keys(firstRow) as (keyof T)[]) : [];

        for (let i = 0; i < len; i++) {
            const row = data[i];
            let hash: any;

            if (kLen === 1) {
                hash = row[keys[0]];
            } else {
                hash = "";
                for (let j = 0; j < kLen; j++) {
                    hash += row[keys[j]] + "|";
                }
            }

            let group = groups.get(hash);
            if (group === undefined) {
                group = [];
                groups.set(hash, group);
            }
            group.push(row);
        }

        return new GroupedData(groups, keys, allKeys);
    }

    head(n: number = 10): DataFrame<T> {
        return this.limit(n, { offset: 0, from: "start" })
    }

    join<U>(
        other: DataFrame<U>,
        on: (keyof T & keyof U) | (keyof T & keyof U)[],
        how: JoinType = "inner",
        suffixes: [string, string] = ["", "_right"]
    ): DataFrame<any> {
        const leftData = this.data;
        const rightData = other.collect();
        const joinKeys = Array.isArray(on) ? on : [on];
        const kLen = joinKeys.length;
        const [leftSuffix, rightSuffix] = suffixes;

        const leftKeys = Object.keys(leftData[0] || {});
        const rightKeys = Object.keys(rightData[0] || {});
        const rightKeySet = new Set(rightKeys);
        const leftKeySet = new Set(leftKeys);
        const joinKeySet = new Set(joinKeys as string[]);

        const leftMap: [string, string][] = leftKeys.map(k =>
            [k, (rightKeySet.has(k) && !joinKeySet.has(k)) ? `${k}${leftSuffix}` : k]
        );
        const rightMap: [string, string][] = rightKeys.filter(k => !joinKeySet.has(k)).map(k =>
            [k, (leftKeySet.has(k)) ? `${k}${rightSuffix}` : k]
        );

        const rightHash = new Map<any, U[]>();
        for (let i = 0; i < rightData.length; i++) {
            const rRow = rightData[i] as any;
            let hash: any;
            if (kLen === 1) {
                hash = rRow[joinKeys[0]];
            } else {
                hash = "";
                for (let j = 0; j < kLen; j++) hash += rRow[joinKeys[j]] + "|";
            }

            let group = rightHash.get(hash);
            if (!group) { group = []; rightHash.set(hash, group); }
            group.push(rRow);
        }

        const result: any[] = [];
        const consumedRightKeys = new Set<any>();

        for (let i = 0; i < leftData.length; i++) {
            const lRow = leftData[i] as any;
            let hash: any;
            if (kLen === 1) {
                hash = lRow[joinKeys[0]];
            } else {
                hash = "";
                for (let j = 0; j < kLen; j++) hash += lRow[joinKeys[j]] + "|";
            }

            const matches = rightHash.get(hash);

            if (matches) {
                if (how === "outer" || how === "right") consumedRightKeys.add(hash);
                for (let m = 0; m < matches.length; m++) {
                    const rRow = matches[m] as any;
                    const merged: any = {};

                    for (let k = 0; k < leftMap.length; k++) merged[leftMap[k][1]] = lRow[leftMap[k][0]];
                    for (let k = 0; k < rightMap.length; k++) merged[rightMap[k][1]] = rRow[rightMap[k][0]];
                    result.push(merged);
                }
            } else if (how === "left" || how === "outer") {
                const merged: any = {};

                for (let k = 0; k < leftMap.length; k++) merged[leftMap[k][1]] = lRow[leftMap[k][0]];
                for (let k = 0; k < rightMap.length; k++) merged[rightMap[k][1]] = null;
                result.push(merged);
            }
        }

        if (how === "outer" || how === "right") {
            for (const [hash, matches] of rightHash.entries()) {
                if (!consumedRightKeys.has(hash)) {
                    for (let m = 0; m < matches.length; m++) {
                        const rRow = matches[m] as any;
                        const merged: any = {};
                        for (let k = 0; k < leftMap.length; k++) {
                            const originalKey = leftMap[k][0];
                            merged[leftMap[k][1]] = joinKeySet.has(originalKey) ? rRow[originalKey] : null;
                        }
                        for (let k = 0; k < rightMap.length; k++) merged[rightMap[k][1]] = rRow[rightMap[k][0]];
                        result.push(merged);
                    }
                }
            }
        }

        return new DataFrame(result);
    }

    limit(n: number, options: { offset?: number, from?: LimitPosition } = {}): DataFrame<T> {
        const { offset = 0, from = "start" } = options;
        const len = this.data.length;

        const safeN = Math.max(Math.floor(n), 0);
        const safeOffset = Math.max(Math.floor(offset), 0);

        if (safeN === 0 || len === 0 || safeOffset >= len) {
            return new DataFrame<T>([]);
        }

        if (from === "end") {
            const actualEnd = Math.max(len - safeOffset, 0);
            const actualStart = Math.max(actualEnd - safeN, 0);
            return new DataFrame(this.data.slice(actualStart, actualEnd));
        }

        const actualEnd = Math.min(safeOffset + safeN, len);
        return new DataFrame(this.data.slice(safeOffset, actualEnd));
    }

    pivot(
        index: (keyof T)[],
        columns: keyof T,
        values: keyof T
    ): DataFrame<any> {
        const data = this.data;
        const len = data.length;
        if (len === 0) return new DataFrame<any>([]);

        const groups = new Map<string, any>();
        const colNames = new Set<string>();
        const indexLen = index.length;

        for (let i = 0; i < len; i++) {
            const row = data[i] as any;

            let rowKey = "";
            for (let j = 0; j < indexLen; j++) {
                rowKey += row[index[j]] + "|";
            }

            const pivotColName = String(row[columns]);
            colNames.add(pivotColName);

            let groupedRow = groups.get(rowKey);
            if (groupedRow === undefined) {
                groupedRow = {};
                for (let j = 0; j < indexLen; j++) {
                    const k = index[j] as string;
                    groupedRow[k] = row[k];
                }
                groups.set(rowKey, groupedRow);
            };

            groupedRow[pivotColName] = row[values];
        }

        const result = Array.from(groups.values());
        const allCols = Array.from(colNames);

        for (const row of result) {
            for (const col of allCols) {
                if (row[col] === undefined) row[col] = null;
            }
        }

        return new DataFrame(result);
    }

    rename(mapping: Partial<Record<keyof T, string>>): DataFrame<any> {
        const data = this.data;
        const len = data.length;

        if (len === 0) return new DataFrame<T>([]);

        const keys = Object.keys(data[0] as object);
        const renameMap: Record<string, string> = {};

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            renameMap[key] = (mapping as any)[key] || key;
        }

        const newRows = new Array(len);
        const keyLen = keys.length;

        for (let i = 0; i < len; i++) {
            const row = data[i] as any;
            const newRow: any = {};

            for (let j = 0; j < keyLen; j++) {
                const key = keys[j];
                newRow[renameMap[key]] = row[key];
            }

            newRows[i] = newRow;
        }

        return new DataFrame(newRows);
    }

    select<U extends Record<string, any> = any>(
        ...args: (string | IExpr | (string | IExpr)[])[]
    ): DataFrame<U> {
        const exprs = args.flat();
        const data = this.data;
        const len = data.length;

        const selectCols: string[] = [];
        const selectExprs: Array<{ expr: IExpr; isWildcard: boolean }> = [];
        let hasWildcard = false;

        for (let i = 0; i < exprs.length; i++) {
            const expr = exprs[i];
            if (typeof expr === "string") {
                selectCols.push(expr);
            } else if (expr && 'evaluate' in expr) {
                const isWildcard = (expr as any).colName === "*" || expr instanceof AllColumnsExpr;
                if (isWildcard) hasWildcard = true;
                selectExprs.push({ expr, isWildcard });
            }
        }

        const newRows = new Array(len);
        const colLen = selectCols.length;
        const exprLen = selectExprs.length;

        for (let i = 0; i < len; i++) {
            const row = data[i] as any;
            const newRow: Record<string, any> = hasWildcard ? { ...row } : {};

            for (let j = 0; j < colLen; j++) {
                const col = selectCols[j];
                newRow[col] = row[col];
            }

            for (let j = 0; j < exprLen; j++) {
                const { expr, isWildcard } = selectExprs[j];
                if (!isWildcard) {
                    const targetKey = expr.outputName || (expr as any).colName;
                    newRow[targetKey] = expr.evaluate(row);
                }
            }

            newRows[i] = newRow;
        }

        return new DataFrame(newRows as U[]);
    }

    slice(start: number, end?: number): DataFrame<T> {
        const total = this.data.length;

        const actualStart = start < 0 ? Math.max(total + start, 0) : Math.min(start, total);
        const actualEnd = end === undefined
            ? total
            : (end < 0 ? Math.max(total + end, 0) : Math.min(end, total));

        const n = Math.max(actualEnd - actualStart, 0);

        return this.limit(n, { offset: actualStart });
    }

    sort(config: {
        by: keyof T | (keyof T)[] | IExpr | IExpr[]
        descending?: boolean | boolean[]
        nullsLast?: boolean
        custom?: Partial<Record<keyof T, (a: any, b: any) => number>>
    }): DataFrame<T> {
        const { by, descending = false, nullsLast = true, custom } = config;
        const data = this.data;
        if (data.length === 0) return new DataFrame<T>([]);

        const sortKeys = Array.isArray(by) ? by : [by];
        const descArray = Array.isArray(descending)
            ? descending
            : new Array(sortKeys.length).fill(descending);

        const plan = sortKeys.map((keyOrExpr, i) => {
            const isDesc = descArray[i] ? -1 : 1;
            const customComp = (custom && typeof keyOrExpr === "string") ? custom[keyOrExpr as keyof T] : null;

            return {
                getValue: (row: T) => (keyOrExpr as any)?.evaluate
                    ? (keyOrExpr as any).evaluate(row)
                    : (row as any)[keyOrExpr as string],
                isDesc,
                customComp
            };
        });

        const planLen = plan.length;
        const nullMultiplier = nullsLast ? 1 : -1;

        const sorted = [...data].sort((a, b) => {
            for (let i = 0; i < planLen; i++) {
                const { getValue, isDesc, customComp } = plan[i];
                const vA = getValue(a);
                const vB = getValue(b);

                if (customComp) {
                    const res = customComp(vA, vB);
                    if (res !== 0) return res * isDesc;
                    continue;
                }

                if (vA == null || vB == null) {
                    if (vA === vB) continue;
                    return (vA == null ? 1 : -1) * nullMultiplier;
                }

                if (vA === vB) continue;

                const res = vA < vB ? -1 : 1;
                return res * isDesc;
            }
            return 0;
        });

        return new DataFrame(sorted);
    }

    tail(n: number = 10): DataFrame<T> {
        return this.limit(n, { offset: 0, from: 'end' })
    }

    to_list<K extends keyof T>(nameOrExpr: K | IExpr): any[] {
        const data = this.data;
        const len = data.length;
        const list = new Array(len);


        const isExpr = typeof nameOrExpr !== "string" && "evaluate" in (nameOrExpr as any);

        if (isExpr) {
            const expr = nameOrExpr as IExpr;
            for (let i = 0; i < len; i++) {
                list[i] = expr.evaluate(data[i]);
            }
        } else {
            const key = nameOrExpr as string;
            for (let i = 0; i < len; i++) {
                const val = (data[i] as any)[key];
                list[i] = val !== undefined ? val : null;
            }
        }
        return list;
    }

    unique<K extends keyof T>(columns?: K[]): DataFrame<T> {
        const data = this.data;
        const len = data.length;
        if (len === 0) return new DataFrame<T>([]);

        if (!columns || columns.length === 0) {
            const seen = new Set<string>();
            const result: T[] = [];
            for (let i = 0; i < len; i++) {
                const row = data[i];
                const hash = JSON.stringify(row);
                if (!seen.has(hash)) {
                    seen.add(hash);
                    result.push(row);
                }
            }
            return new DataFrame(result);
        }

        const seen = new Set<any>();
        const result: T[] = [];
        const kLen = columns.length;

        for (let i = 0; i < len; i++) {
            const row = data[i];
            let hash: any;

            if (kLen === 1) {
                hash = row[columns[0]];
            } else {
                hash = "";
                for (let j = 0; j < kLen; j++) {
                    hash += row[columns[j]] + "|";
                }
            }

            if (!seen.has(hash)) {
                seen.add(hash);
                result.push(row);
            }
        }

        return new DataFrame(result);
    }

    unpivot(
        idVars: (keyof T)[],
        valueVars: (keyof T)[],
        varName: string = "variable",
        valueName: string = "value"
    ): DataFrame<any> {
        const data = this.data;
        const len = data.length;
        const vVarLen = valueVars.length;
        const idVarLen = idVars.length;

        const result = new Array(len * vVarLen);
        let outIdx = 0;

        for (let i = 0; i < len; i++) {
            const row = data[i] as any;

            for (let j = 0; j < vVarLen; j++) {
                const vVar = valueVars[j];
                const newRow: any = {};

                for (let k = 0; k < idVarLen; k++) {
                    const idKey = idVars[k] as string;
                    newRow[idKey] = row[idKey];
                }

                newRow[varName] = vVar as string;
                newRow[valueName] = row[vVar];

                result[outIdx++] = newRow;
            }
        }

        return new DataFrame(result);
    }

    with_columns<U extends Record<string, any>>(
        struct: Record<string, IExpr | any>
    ): DataFrame<T & U> {
        const data = this.data;
        const len = data.length;
        if (len === 0) return new DataFrame<T & U>([]);

        const structEntries = Object.entries(struct);
        const numEntries = structEntries.length;

        const plan = structEntries.map(([name, val]) => {
            const isExpr = val && typeof val === 'object' && 'evaluate' in val;
            return {
                name,
                val,
                isExpr: isExpr as boolean
            };
        });

        const newRows = new Array(len);

        for (let i = 0; i < len; i++) {
            const row = data[i];
            const newRow = { ...row } as any;

            for (let j = 0; j < numEntries; j++) {
                const step = plan[j];
                if (step.isExpr) {
                    newRow[step.name] = (step.val as IExpr).evaluate(row);
                } else {
                    newRow[step.name] = step.val;
                }
            }
            newRows[i] = newRow;
        }

        return new DataFrame(newRows);
    }
}