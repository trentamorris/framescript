import { DataType as BaseDataType } from "./DataType";
import {
    Int8,
    Int16,
    Int32,
    Int64,
    UInt8,
    UInt16,
    UInt32,
    UInt64,
    Float32,
    Float64,
    DecimalType,
    Boolean,
    Utf8,
    Binary,
    Date,
    Datetime,
    Time,
    Duration,
    Object,
    Null,
    List,
    Struct
} from "./types";

export { BaseDataType as DataType };

export const DataTypeRegistry = {
    Int8,
    Int16,
    Int32,
    Int64,
    UInt8,
    UInt16,
    UInt32,
    UInt64,
    Float32,
    Float64,
    Decimal: (precision?: number, scale?: number) => new DecimalType(precision, scale),
    Boolean,
    Utf8,
    Binary,
    Date,
    Datetime,
    Time,
    Duration,
    Object,
    Null,
    List,
    Struct
};

export * from "./types";
export * from "./DataType";
