import type { IExpr } from "../types";

export type ExprConstructor = new (...args: any[]) => IExpr;

export interface RandomOptions {
    min?: number;
    max?: number;
    integer?: boolean;
}

