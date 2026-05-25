import { UnsignedIntegerType, DataType } from "../DataType";
import { toValidBigInt } from "../../utils";

export class UInt64Type extends UnsignedIntegerType {
    readonly name = "UInt64";

    coerce(val: any): bigint | null {
        return toValidBigInt(val, "UInt64");
    }

    equals(other: DataType): boolean {
        return other.name === "UInt64";
    }
}

export const UInt64 = new UInt64Type();
