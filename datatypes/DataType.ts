export abstract class DataType {
    abstract readonly name: string;
    abstract coerce(val: any): any;
    abstract equals(other: DataType): boolean;

    get isNumeric(): boolean { return false; }
    get isInteger(): boolean { return false; }
    get isFloat(): boolean { return false; }
    get isSigned(): boolean { return false; }
    get isUnsigned(): boolean { return false; }
    get isTemporal(): boolean { return false; }
    get isNested(): boolean { return false; }
}
