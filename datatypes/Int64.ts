import { DataType } from "./DataType";

export class Int64Type extends DataType {
    readonly name = "Int64";

    override get isNumeric(): boolean { return true; }
    override get isInteger(): boolean { return true; }
    override get isSigned(): boolean { return true; }

    coerce(val: any): bigint | null {
        if (val == null) return null;
        try {
            let bigintVal: bigint;
            if (typeof val === "bigint") {
                bigintVal = val;
            } else if (typeof val === "number") {
                bigintVal = BigInt(Math.trunc(val));
            } else {
                // If it has decimal parts as a string, e.g. "12.3", handle truncation
                const str = String(val);
                const dotIdx = str.indexOf(".");
                const cleanStr = dotIdx !== -1 ? str.slice(0, dotIdx) : str;
                bigintVal = BigInt(cleanStr);
            }
            const min = -9223372036854775808n;
            const max = 9223372036854775807n;
            if (bigintVal < min) return min;
            if (bigintVal > max) return max;
            return bigintVal;
        } catch {
            return null;
        }
    }

    equals(other: DataType): boolean {
        return other.name === "Int64";
    }
}

export const Int64 = new Int64Type();
