import { ExprBase, derive } from "./ExprBase"
import { ArithmeticExpr } from "./mixins/ArithmeticExpr"
import { ComparisonExpr } from "./mixins/ComparisonExpr"
import { AggregationExpr } from "./mixins/AggregationExpr"
import { WindowExpr } from "./mixins/WindowExpr"
import { StringExpr } from "./mixins/StringExpr"
import { LogicalExpr } from "./mixins/LogicalExpr"
import { TemporalExpr } from "./mixins/TemporalExpr"
import { ListExpr } from "./mixins/ListExpr"

export class ColumnExpr<T> extends ListExpr(TemporalExpr(LogicalExpr(StringExpr(WindowExpr(AggregationExpr(ComparisonExpr(ArithmeticExpr(ExprBase)))))))) {
    public colName: string

    constructor(colName: keyof T | string) {
        super()
        this.colName = String(colName)
        this.outputName = this.colName
    }

    replace(mapping: Map<any, any> | Record<string | number, any>, defaultValue?: any): this {
        const map = mapping instanceof Map ? mapping : new Map(Object.entries(mapping));
        return derive(this, (vArray) => {
            const height = vArray.length;
            const result = new Array(height);
            for (let i = 0; i < height; i++) {
                const currentValue = vArray[i];
                if (map.has(currentValue)) {
                    result[i] = map.get(currentValue);
                } else {
                    result[i] = defaultValue !== undefined ? defaultValue : currentValue;
                }
            }
            return result;
        }) as any;
    }
}
