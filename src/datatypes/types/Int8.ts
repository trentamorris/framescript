import { SignedIntegerType, DataType } from "../DataType";
import { toValidInt } from "../../utils";

export class Int8Type extends SignedIntegerType {
    readonly name = "Int8";

    coerce(val: any): number | null {
        return toValidInt(val, "Int8");
    }

    equals(other: DataType): boolean {
        return other.name === "Int8";
    }
    allocate(size: number): any[] { return new Array(size).fill(null); }

}

export const Int8 = new Int8Type();
