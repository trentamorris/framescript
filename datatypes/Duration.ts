import { DataType } from "./DataType";

export class DurationType extends DataType {
    readonly name = "Duration";

    override get isTemporal(): boolean { return true; }

    coerce(val: any): number | null {
        if (val == null) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
    }

    equals(other: DataType): boolean {
        return other.name === "Duration";
    }
}

export const Duration = new DurationType();
