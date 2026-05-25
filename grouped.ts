import { DataFrame } from "./dataframe"
import { ColumnExpr, AllColumnsExpr, resolveColumnSelectors } from "./expressions"
import type { IExpr } from "./types"

export class GroupedData<T, K extends keyof T> {
    private groups: Map<string, T[]>
    private keys: K[]
    private allKeys: (keyof T)[]


    constructor(groups: Map<string, T[]>, keys: K[], allKeys: (keyof T)[]) {
        this.groups = groups
        this.keys = keys
        this.allKeys = allKeys
    }

    collect(): DataFrame<any> {
        const results = Array.from(this.groups.values()).map(groupRows => {
            const row: any = {};
            for (const k of this.keys) {
                row[k as string] = groupRows[0][k];
            }
            return row;
        });
        return new DataFrame(results);
    }

    agg(...exprs: (IExpr | any)[]): DataFrame<any> {
        const allKeysStr = this.allKeys.map(String);
        const keysStr = this.keys.map(String);
        const expandedExprs = resolveColumnSelectors(exprs.flat(), allKeysStr, keysStr);

        const results = Array.from(this.groups.values()).map(groupRows => {
            const row: any = {};

            for (const k of this.keys) {
                row[k as string] = groupRows[0][k];
            }

            for (const e of expandedExprs) {
                const targetKey = e.outputName || e.colName || "*";

                if (e.aggFn) {
                    const groupValues = groupRows.map(r => e.evaluatePreGrouping(r));
                    const aggregated = e.aggFn(groupValues);
                    row[targetKey] = e.evaluatePostGrouping(aggregated, groupRows[0]);
                } else {
                    row[targetKey] = e.evaluate(groupRows[0]);
                }
            }
            return row;
        });

        return new DataFrame(results);
    }
}