import { ExprBase } from "./ExprBase"
import { ArithmeticExpr } from "./mixins/ArithmeticExpr"
import { ComparisonExpr } from "./mixins/ComparisonExpr"
import { AggregationExpr } from "./mixins/AggregationExpr"
import { WindowExpr } from "./mixins/WindowExpr"
import { StringExpr } from "./mixins/StringExpr"
import { LogicalExpr } from "./mixins/LogicalExpr"
import { TemporalExpr } from "./mixins/TemporalExpr"
import { ListExpr } from "./mixins/ListExpr"
import { ManipulationExpr } from "./mixins/ManipulationExpr"

export class ColumnExpr<T> extends ListExpr(TemporalExpr(LogicalExpr(StringExpr(WindowExpr(AggregationExpr(ComparisonExpr(ArithmeticExpr(ManipulationExpr(ExprBase))))))))) {
    public colName: string
    public colNames?: string[];
    public excludedCols: string[] = [];

    constructor(colName: keyof T | string | (keyof T | string)[]) {
        super()
        if (Array.isArray(colName)) {
            this.colNames = colName.map(String);
            this.colName = "";
            this.outputName = "";
        } else {
            this.colName = String(colName);
            this.outputName = this.colName;
        }
    }
}
