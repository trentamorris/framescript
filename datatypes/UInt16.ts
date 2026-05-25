import { DataType } from "./DataType";

export class UInt16Type extends DataType {
    readonly name = "UInt16";

    override get isNumeric(): boolean { return true; }
    override get isInteger(): boolean { return true; }
    override get isUnsigned(): boolean { return true; }

    coerce(val: any): number | null {
        if (val == null) return null;
        const num = Number(val);
        if (isNaN(num)) return null;
        const intVal = Math.trunc(num);
        return Math.max(0, Math.min(65535, intVal));
    }

    equals(other: DataType): boolean {
        return other.name === "UInt16";
    }
}

export const UInt16 = new UInt16Type();
