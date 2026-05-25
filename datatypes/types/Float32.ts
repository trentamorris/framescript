import { FloatDataType, DataType } from "../DataType";
import { toValidNumber } from "../../utils";

export class Float32Type extends FloatDataType {
    readonly name = "Float32";

    coerce(val: any): number | null {
        const num = toValidNumber(val);
        return num === null ? null : Math.fround(num);
    }

    equals(other: DataType): boolean {
        return other.name === "Float32";
    }
}

export const Float32 = new Float32Type();
