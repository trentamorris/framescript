import { SignedIntegerType, DataType } from "../DataType";
import { coerceInt, INT_RANGES } from "../../utils";

export class Int16Type extends SignedIntegerType {
    readonly name = "Int16";

    coerce(val: any): number | null {
        return coerceInt(val, INT_RANGES.Int16);
    }

    equals(other: DataType): boolean {
        return other.name === "Int16";
    }
}

export const Int16 = new Int16Type();
