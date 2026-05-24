import { DataFrame } from "./dataframe"
import { ColumnExpr } from "./expressions"
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
        const expandedExprs: any[] = [];

        for (const expr of exprs.flat()) {
            if (expr && typeof expr === 'object' && 'evaluate' in expr && !expr.colName) {
                for (const key of this.allKeys) {
                    if (!this.keys.includes(key as K)) {
                        const e = new ColumnExpr<T>(key as string);
                        if (expr.aggFn) e.aggFn = expr.aggFn;
                        expandedExprs.push(e);
                    }
                }
            } else {
                expandedExprs.push(expr);
            }
        }

        const results = Array.from(this.groups.values()).map(groupRows => {
            const row: any = {};

            for (const k of this.keys) {
                row[k as string] = groupRows[0][k];
            }

            for (const e of expandedExprs) {
                const targetKey = e.outputName || e.colName;
                const groupValues = groupRows.map(r => e.evaluate(r));

                if (e.aggFn) {
                    row[targetKey] = e.aggFn(groupValues);
                } else {
                    row[targetKey] = groupValues[0];
                }
            }
            return row;
        });

        return new DataFrame(results);
    }
}