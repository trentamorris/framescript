export type AggFn<V, R = any> = (values: V[]) => R;
export type OpFn = (val: any, row: any) => any;
export interface IExpr {
    ops: OpFn[];
    colName?: string
    outputName?: string
    _resolve(val: any, row: any): any;
    evaluate(row: any): any;
}
export type ExprConstructor = new (...args: any[]) => IExpr;
export type JoinType = "inner" | "left" | "outer" | "right"
export type LimitPosition = "start" | "end";

export type ConcatHow = "vertical" | "horizontal" | "diagonal";
export interface ConcatOptions {
    how?: ConcatHow;
    //rechunk?: boolean;
    //strict?: boolean;
    //parallel?: boolean;
}
