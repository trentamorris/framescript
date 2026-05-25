import { DataType } from "../DataType";

export class ObjectType extends DataType {
    readonly name = "Object";

    override get isObject(): boolean { return true; }

    coerce(val: any): any {
        return val === undefined ? null : val;
    }

    equals(other: DataType): boolean {
        return other.name === "Object";
    }
}

export const Object = new ObjectType();
