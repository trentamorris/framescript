import { ColumnExpr } from "../ColumnExpr";
import type { IntoExpr } from "../../types";
import { isColExpr } from "../../utils";

export function implode(column: IntoExpr | IntoExpr[]): ColumnExpr<any> {
    const toExpr = (col: IntoExpr | IntoExpr[]) =>
        isColExpr(col) ? (col as ColumnExpr<any>) : new ColumnExpr(col as string | string[]);

    return toExpr(column).implode();
}
