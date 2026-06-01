import { ColumnExpr } from "../ColumnExpr";
import { ALL_COLUMNS_MARKER } from "../constants";

/**
 * Creates an expression targeting all columns in the DataFrame.
 */
export function all(): ColumnExpr<any> {
    return new ColumnExpr(ALL_COLUMNS_MARKER);
}
