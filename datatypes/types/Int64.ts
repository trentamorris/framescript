import { SignedIntegerType, DataType } from "../DataType";
import { toValidBigInt } from "../../utils";

export class Int64Type extends SignedIntegerType {
    readonly name = "Int64";

    coerce(val: any): bigint | null {
        return toValidBigInt(val);
    }

    equals(other: DataType): boolean {
        return other.name === "Int64";
    }
}

export const Int64 = new Int64Type();
