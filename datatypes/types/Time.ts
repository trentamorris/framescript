import { TemporalDataType, DataType } from "../DataType";
import { toValidDate } from "../../utils";

export class TimeType extends TemporalDataType {
    readonly name = "Time";

    coerce(val: any): string | null {
        if (val == null) return null;
        if (typeof val === "string") {
            // Validate HH:MM:SS format
            const match = val.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
            if (match) return val;
        }
        
        const d = toValidDate(val);
        if (!d) return null;

        const h = String(d.getUTCHours()).padStart(2, "0");
        const m = String(d.getUTCMinutes()).padStart(2, "0");
        const s = String(d.getUTCSeconds()).padStart(2, "0");
        const ms = String(d.getUTCMilliseconds()).padStart(3, "0");
        return `${h}:${m}:${s}.${ms}`;
    }

    equals(other: DataType): boolean {
        return other.name === "Time";
    }
}

export const Time = new TimeType();
