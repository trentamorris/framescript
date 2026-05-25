import { DataType } from "./DataType";

export class Int16Type extends DataType {
    readonly name = "Int16";

    override get isNumeric(): boolean { return true; }
    override get isInteger(): boolean { return true; }
    override get isSigned(): boolean { return true; }

    coerce(val: any): number | null {
        if (val == null) return null;
        const num = Number(val);
        if (isNaN(num)) return null;
        const intVal = Math.trunc(num);
        return Math.max(-32768, Math.min(32767, intVal));
    }

    equals(other: DataType): boolean {
        return other.name === "Int16";
    }
}

export const Int16 = new Int16Type();
