import { DataType } from "./DataType";

export class DecimalType extends DataType {
    readonly name: string;

    override get isNumeric(): boolean { return true; }

    constructor(public readonly precision?: number, public readonly scale?: number) {
        super();
        this.name = precision !== undefined && scale !== undefined
            ? `Decimal(${precision}, ${scale})`
            : "Decimal";
    }

    coerce(val: any): number | null {
        if (val == null) return null;
        const num = Number(val);
        if (isNaN(num)) return null;
        if (this.scale !== undefined) {
            // Round/coerce value to target scale
            const multiplier = Math.pow(10, this.scale);
            return Math.round(num * multiplier) / multiplier;
        }
        return num;
    }

    equals(other: DataType): boolean {
        return other instanceof DecimalType &&
            this.precision === other.precision &&
            this.scale === other.scale;
    }
}
