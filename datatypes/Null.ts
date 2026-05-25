import { DataType } from "./DataType";

export class NullType extends DataType {
    readonly name = "Null";

    coerce(val: any): null {
        return null;
    }

    equals(other: DataType): boolean {
        return other.name === "Null";
    }
}

export const Null = new NullType();
