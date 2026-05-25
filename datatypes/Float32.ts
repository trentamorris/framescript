import { DataType } from "./DataType";

export class Float32Type extends DataType {
    readonly name = "Float32";

    override get isNumeric(): boolean { return true; }
    override get isFloat(): boolean { return true; }

    coerce(val: any): number | null {
        if (val == null) return null;
        const num = Number(val);
        return isNaN(num) ? null : Math.fround(num);
    }

    equals(other: DataType): boolean {
        return other.name === "Float32";
    }
}

export const Float32 = new Float32Type();
