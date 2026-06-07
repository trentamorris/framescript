import { ColumnExpr } from "../ColumnExpr";
import { LITERAL_MARKER } from "../constants";
import { ShapeError } from "../../exceptions";
import type { RegisteredDataType } from "../../types";

/**
 * Creates a literal column expression that repeats the given value.
 * If n is specified, it repeats the value n times.
 * If strict is true (default), a height mismatch with the DataFrame will throw a ShapeError.
 * If strict is false, either pad or truncate must be true to handle mismatch:
 *  - pad: pads with nulls if n < DataFrame height, throws if n > DataFrame height.
 *  - truncate: truncates if n > DataFrame height, throws if n < DataFrame height.
 */
export function repeat(
    value: any,
    options: {
        n?: number;
        dtype?: RegisteredDataType;
        name?: string;
        strict?: boolean;
        pad?: boolean;
        truncate?: boolean;
    } = {}
): ColumnExpr<any> {
    const expr = new ColumnExpr(LITERAL_MARKER);
    expr.isLiteral = true;
    expr.literalValue = value;
    if (options.name) {
        expr.outputName = options.name;
    }

    let strict = options.strict !== false;
    const pad = !!options.pad;
    const truncate = !!options.truncate;

    if (pad || truncate) {
        if (options.strict === true) {
            throw new Error("Cannot set strict to true when pad or truncate is enabled.");
        }
        if (pad && truncate) {
            throw new Error("pad and truncate options are mutually exclusive.");
        }
        strict = false;
    } else if (!strict) {
        throw new Error("When strict is false, either pad or truncate must be set to true.");
    }

    expr.ops.push((vArray) => {
        const targetHeight = vArray.length;
        const specifiedHeight = options.n !== undefined ? options.n : targetHeight;

        if (strict) {
            if (specifiedHeight !== targetHeight) {
                const result = new Array(specifiedHeight);
                const finalVal = options.dtype ? options.dtype.coerce(value) : value;
                for (let i = 0; i < specifiedHeight; i++) {
                    result[i] = finalVal;
                }
                return result;
            }
        } else {
            if (pad) {
                if (specifiedHeight > targetHeight) {
                    throw new ShapeError(
                        `Cannot pad repeat output: specified length ${specifiedHeight} is greater than DataFrame height ${targetHeight} (requires truncation).`
                    );
                }
            } else if (truncate) {
                if (specifiedHeight < targetHeight) {
                    throw new ShapeError(
                        `Cannot truncate repeat output: specified length ${specifiedHeight} is less than DataFrame height ${targetHeight} (requires padding).`
                    );
                }
            }
        }

        const finalHeight = targetHeight;
        const result = new Array(finalHeight);
        const finalVal = options.dtype ? options.dtype.coerce(value) : value;
        const fillCount = options.n !== undefined ? Math.min(specifiedHeight, finalHeight) : finalHeight;

        for (let i = 0; i < finalHeight; i++) {
            result[i] = i < fillCount ? finalVal : null;
        }
        return result;
    });

    return expr;
}
