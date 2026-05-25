import { SignedIntegerType, DataType } from "../DataType";
import { coerceBigInt } from "../../utils";

export class Int64Type extends SignedIntegerType {
    readonly name = "Int64";

    coerce(val: any): bigint | null {
        return coerceBigInt(val, "Int64");
    }

    equals(other: DataType): boolean {
        return other.name === "Int64";
    }
}

export const Int64 = new Int64Type();
