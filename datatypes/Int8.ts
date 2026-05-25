import { DataType } from "./DataType";

export class Int8Type extends DataType {
    readonly name = "Int8";

    override get isNumeric(): boolean { return true; }
    override get isInteger(): boolean { return true; }
    override get isSigned(): boolean { return true; }

    coerce(val: any): number | null {
        if (val == null) return null;
        const num = Number(val);
        if (isNaN(num)) return null;
        const intVal = Math.trunc(num);
        return Math.max(-128, Math.min(127, intVal));
    }

    equals(other: DataType): boolean {
        return other.name === "Int8";
    }
}

export const Int8 = new Int8Type();
