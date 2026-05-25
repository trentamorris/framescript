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
    get isBoolean(): boolean { return false; }
    get isString(): boolean { return false; }
    get isUtf8(): boolean { return false; }
    get isObject(): boolean { return false; }
    get isNull(): boolean { return false; }
    get isBinary(): boolean { return false; }
}

export abstract class NumericDataType extends DataType {
    override get isNumeric(): boolean { return true; }
}

export abstract class IntegerDataType extends NumericDataType {
    override get isInteger(): boolean { return true; }
}

export abstract class SignedIntegerType extends IntegerDataType {
    override get isSigned(): boolean { return true; }
}

export abstract class UnsignedIntegerType extends IntegerDataType {
    override get isUnsigned(): boolean { return true; }
}

export abstract class FloatDataType extends NumericDataType {
    override get isFloat(): boolean { return true; }
}

export abstract class TemporalDataType extends DataType {
    override get isTemporal(): boolean { return true; }
}

export abstract class NestedDataType extends DataType {
    override get isNested(): boolean { return true; }
}
