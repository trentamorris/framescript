import { UnsignedIntegerType, DataType } from "../DataType";
import { coerceInt, INT_RANGES } from "../../utils";

export class UInt16Type extends UnsignedIntegerType {
    readonly name = "UInt16";

    coerce(val: any): number | null {
        return coerceInt(val, INT_RANGES.UInt16);
    }

    equals(other: DataType): boolean {
        return other.name === "UInt16";
    }
}

export const UInt16 = new UInt16Type();
