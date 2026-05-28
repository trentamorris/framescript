import { SignedIntegerType, DataType } from "../DataType";
import { toValidInt } from "../../utils";

export class Int32Type extends SignedIntegerType {
    readonly name = "Int32";
    
    coerce(val: any): number | null {
        return toValidInt(val);
    }
    
    equals(other: DataType): boolean {
        return other.name === "Int32";
    }
    allocate(size: number): any[] { return new Array(size).fill(null); }

}

export const Int32 = new Int32Type();
