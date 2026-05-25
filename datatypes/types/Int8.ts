import { SignedIntegerType, DataType } from "../DataType";
import { coerceInt } from "../../utils";

export class Int8Type extends SignedIntegerType {
    readonly name = "Int8";

    coerce(val: any): number | null {
        return coerceInt(val, "Int8");
    }

    equals(other: DataType): boolean {
        return other.name === "Int8";
    }
}

export const Int8 = new Int8Type();
