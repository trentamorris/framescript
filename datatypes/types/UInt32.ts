import { UnsignedIntegerType, DataType } from "../DataType";
import { coerceInt } from "../../utils";

export class UInt32Type extends UnsignedIntegerType {
    readonly name = "UInt32";

    coerce(val: any): number | null {
        return coerceInt(val, "UInt32");
    }

    equals(other: DataType): boolean {
        return other.name === "UInt32";
    }
}

export const UInt32 = new UInt32Type();
