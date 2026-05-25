import { UnsignedIntegerType, DataType } from "../DataType";
import { coerceInt, INT_RANGES } from "../../utils";

export class UInt32Type extends UnsignedIntegerType {
    readonly name = "UInt32";

    coerce(val: any): number | null {
        return coerceInt(val, INT_RANGES.UInt32);
    }

    equals(other: DataType): boolean {
        return other.name === "UInt32";
    }
}

export const UInt32 = new UInt32Type();
