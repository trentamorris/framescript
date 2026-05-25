import { SignedIntegerType, DataType } from "../DataType";
import { coerceInt } from "../../utils";

export class Int32Type extends SignedIntegerType {
    readonly name = "Int32";
    
    coerce(val: any): number | null {
        return coerceInt(val, "Int32");
    }
    
    equals(other: DataType): boolean {
        return other.name === "Int32";
    }
}

export const Int32 = new Int32Type();
