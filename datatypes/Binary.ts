import { DataType } from "./DataType";

export class BinaryType extends DataType {
    readonly name = "Binary";

    coerce(val: any): Uint8Array | null {
        if (val == null) return null;
        if (val instanceof Uint8Array) return val;
        if (typeof val === "string") {
            return new TextEncoder().encode(val);
        }
        if (Array.isArray(val) || (typeof val === "object" && "length" in val)) {
            try {
                return new Uint8Array(val);
            } catch {
                return null;
            }
        }
        return null;
    }

    equals(other: DataType): boolean {
        return other.name === "Binary";
    }
}

export const Binary = new BinaryType();
