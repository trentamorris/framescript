import { ColumnExpr } from "../ColumnExpr";
import { LITERAL_MARKER } from "../constants";

/**
 * Creates a literal column expression that repeats the given value for all rows.
 */
export function lit(value: any): ColumnExpr<any> {
    const expr = new ColumnExpr(LITERAL_MARKER);
    expr.isLiteral = true;
    expr.literalValue = value;
    expr.ops.push((vArray) => {
        const height = vArray.length;
        const result = new Array(height);
        for (let i = 0; i < height; i++) {
            result[i] = value;
        }
        return result;
    });
    return expr;
}
