import { ColumnNotFoundError } from "./index";
import type { ColumnDict } from "../types";

export function assertColumnExists(
    columnName: string,
    columns: ColumnDict,
    context: string,
    suffix: string = ""
): void {
    if (!(columnName in columns)) {
        throw new ColumnNotFoundError(columnName, `${context} "${columnName}" does not exist${suffix}`);
    }
}
