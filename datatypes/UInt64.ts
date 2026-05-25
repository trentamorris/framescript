import { DataType } from "./DataType";

export class UInt64Type extends DataType {
    readonly name = "UInt64";

    override get isNumeric(): boolean { return true; }
    override get isInteger(): boolean { return true; }
    override get isUnsigned(): boolean { return true; }

    coerce(val: any): bigint | null {
        if (val == null) return null;
        try {
            let bigintVal: bigint;
            if (typeof val === "bigint") {
                bigintVal = val;
            } else if (typeof val === "number") {
                bigintVal = BigInt(Math.trunc(val));
            } else {
                const str = String(val);
                const dotIdx = str.indexOf(".");
                const cleanStr = dotIdx !== -1 ? str.slice(0, dotIdx) : str;
                bigintVal = BigInt(cleanStr);
            }
            const min = 0n;
            const max = 18446744073709551615n;
            if (bigintVal < min) return min;
            if (bigintVal > max) return max;
            return bigintVal;
        } catch {
            return null;
        }
    }

    equals(other: DataType): boolean {
        return other.name === "UInt64";
    }
}

export const UInt64 = new UInt64Type();
