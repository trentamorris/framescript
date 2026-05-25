import { DataType as BaseDataType } from "./DataType";
import { Int8 } from "./Int8";
import { Int16 } from "./Int16";
import { Int32 } from "./Int32";
import { Int64 } from "./Int64";
import { UInt8 } from "./UInt8";
import { UInt16 } from "./UInt16";
import { UInt32 } from "./UInt32";
import { UInt64 } from "./UInt64";
import { Float32 } from "./Float32";
import { Float64 } from "./Float64";
import { DecimalType } from "./Decimal";
import { Boolean } from "./Boolean";
import { Utf8 } from "./Utf8";
import { Binary } from "./Binary";
import { Date } from "./Date";
import { Datetime } from "./Datetime";
import { Time } from "./Time";
import { Duration } from "./Duration";
import { Object } from "./Object";
import { Null } from "./Null";
import { List } from "./List";
import { Struct } from "./Struct";

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
