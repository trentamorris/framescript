import { UnsignedIntegerType, DataType } from "../DataType";
import { coerceBigInt, BIGINT_RANGES } from "../../utils";

export class UInt64Type extends UnsignedIntegerType {
    readonly name = "UInt64";

    coerce(val: any): bigint | null {
        return coerceBigInt(val, BIGINT_RANGES.UInt64);
    }

    equals(other: DataType): boolean {
        return other.name === "UInt64";
    }
}

export const UInt64 = new UInt64Type();
