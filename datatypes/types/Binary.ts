import { DataType } from "../DataType";
import { toValidBinary } from "../../utils";

export class BinaryType extends DataType {
    readonly name = "Binary";

    override get isBinary(): boolean { return true; }

    coerce(val: any): Uint8Array | null {
        return toValidBinary(val);
    }

    equals(other: DataType): boolean {
        return other.name === "Binary";
    }
}

export const Binary = new BinaryType();
