import { DataType } from "./DataType";

export class DateType extends DataType {
    readonly name = "Date";

    override get isTemporal(): boolean { return true; }

    coerce(val: any): Date | null {
        if (val == null) return null;
        let d: Date;
        if (val instanceof globalThis.Date) {
            d = new globalThis.Date(val.getTime());
        } else {
            d = new globalThis.Date(val);
        }
        if (isNaN(d.getTime())) return null;
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }

    equals(other: DataType): boolean {
        return other.name === "Date";
    }
}

export const Date = new DateType();
