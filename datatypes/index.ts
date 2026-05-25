import { DataType as BaseDataType } from "./DataType";
import { Int8 } from "./types/Int8";
import { Int16 } from "./types/Int16";
import { Int32 } from "./types/Int32";
import { Int64 } from "./types/Int64";
import { UInt8 } from "./types/UInt8";
import { UInt16 } from "./types/UInt16";
import { UInt32 } from "./types/UInt32";
import { UInt64 } from "./types/UInt64";
import { Float32 } from "./types/Float32";
import { Float64 } from "./types/Float64";
import { DecimalType } from "./types/Decimal";
import { Boolean } from "./types/Boolean";
import { Utf8 } from "./types/Utf8";
import { Binary } from "./types/Binary";
import { Date } from "./types/Date";
import { Datetime } from "./types/Datetime";
import { Time } from "./types/Time";
import { Duration } from "./types/Duration";
import { Object } from "./types/Object";
import { Null } from "./types/Null";
import { List } from "./types/List";
import { Struct } from "./types/Struct";

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
