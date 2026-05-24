import { DataFrame } from "./dataframe"
import { ColumnExpr, AllColumnsExpr } from "./expressions"

export const $tbl = {
    data: <T extends Record<string, any>>(data: T[]) => new DataFrame(data),
    col: <T = any>(name: keyof T | string) => new ColumnExpr<T>(name),
    all: () => new AllColumnsExpr()
};