import { UnsignedIntegerType, DataType } from "../DataType";
import { coerceInt } from "../../utils";

export class UInt8Type extends UnsignedIntegerType {
    readonly name = "UInt8";

    coerce(val: any): number | null {
        return coerceInt(val, "UInt8");
    }

    equals(other: DataType): boolean {
        return other.name === "UInt8";
    }
}

export const UInt8 = new UInt8Type();
