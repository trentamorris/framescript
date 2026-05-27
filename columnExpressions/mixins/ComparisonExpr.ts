import type { IExpr, ExprConstructor } from "../../types"
import { kleene, derive } from "../ExprBase"

export const ComparisonExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        between(lower: any, upper: any, closed: "both" | "left" | "right" | "none" = "both") {
            return derive(this, kleene((v, row) => {
                const l = this._resolve(lower, row);
                const u = this._resolve(upper, row);
                if (l == null || u == null) return null;
                const geLower = closed === "both" || closed === "left" ? v >= l : v > l;
                const leUpper = closed === "both" || closed === "right" ? v <= u : v < u;
                return geLower && leUpper;
            }));
        }
        eq(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v === r;
            })); 
        }
        eq_missing(val: any) {
            return derive(this, (v, row) => {
                const r = this._resolve(val, row);
                if (v == null && r == null) return true;
                if (v == null || r == null) return false;
                return v === r;
            });
        }
        ge(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v >= r;
            })); 
        }
        gt(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v > r;
            })); 
        }
        is_finite() {
            return derive(this, kleene((v) => Number.isFinite(v)));
        }
        is_in(values: any[] | IExpr) {
            return derive(this, kleene((v, row) => {
                const resolved = values && typeof values === 'object' && 'evaluate' in values 
                    ? values.evaluate(row) 
                    : values;
                const arr = Array.isArray(resolved) ? resolved : [];
                const set = new Set(arr);
                return set.has(v);
            }));
        }
        is_infinite() {
            return derive(this, kleene((v) => v === Infinity || v === -Infinity));
        }
        is_nan() {
            return derive(this, kleene((v) => Number.isNaN(v)));
        }
        is_not_nan() {
            return derive(this, kleene((v) => !Number.isNaN(v)));
        }
        is_not_null() { 
            return derive(this, (v) => v != null); 
        }
        is_null() { 
            return derive(this, (v) => v == null); 
        }
        le(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v <= r;
            })); 
        }
        lt(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v < r;
            })); 
        }
        ne(val: any) { 
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v !== r;
            })); 
        }
        ne_missing(val: any) {
            return derive(this, (v, row) => {
                const r = this._resolve(val, row);
                if (v == null && r == null) return false;
                if (v == null || r == null) return true;
                return v !== r;
            });
        }
        not_in(values: any[] | IExpr) {
            return derive(this, kleene((v, row) => {
                const resolved = values && typeof values === 'object' && 'evaluate' in values 
                    ? values.evaluate(row) 
                    : values;
                const arr = Array.isArray(resolved) ? resolved : [];
                const set = new Set(arr);
                return !set.has(v);
            }));
        }
    }
}
