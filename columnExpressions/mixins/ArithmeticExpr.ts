import type { IExpr, ExprConstructor } from "../../types"
import { kleene, derive } from "../ExprBase"
import { clamp } from "../../utils"

export const ArithmeticExpr = <TBase extends ExprConstructor>(Base: TBase) => {
    return class extends Base {
        abs() {
            return derive(this, kleene((v) => Math.abs(v)));
        }
        acos() {
            return derive(this, kleene((v) => (v < -1 || v > 1) ? null : Math.acos(v)));
        }
        acosh() {
            return derive(this, kleene((v) => (v < 1) ? null : Math.acosh(v)));
        }
        add(val: number | IExpr | null) {
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v + r;
            }));
        }
        asin() {
            return derive(this, kleene((v) => (v < -1 || v > 1) ? null : Math.asin(v)));
        }
        asinh() {
            return derive(this, kleene((v) => Math.asinh(v)));
        }
        atan() {
            return derive(this, kleene((v) => Math.atan(v)));
        }
        atanh() {
            return derive(this, kleene((v) => (v <= -1 || v >= 1) ? null : Math.atanh(v)));
        }
        cbrt() {
            return derive(this, kleene((v) => Math.cbrt(v)));
        }
        ceil() {
            return derive(this, kleene((v) => Math.ceil(v)));
        }
        clip(lower: number | null = null, upper: number | null = null) {
            return derive(this, kleene((v) => {
                if (lower !== null && upper !== null) return clamp({ val: v, min: lower, max: upper });
                if (lower !== null) return Math.max(v, lower);
                if (upper !== null) return Math.min(v, upper);
                return v;
            }));
        }
        cos() {
            return derive(this, kleene((v) => Math.cos(v)));
        }
        cosh() {
            return derive(this, kleene((v) => Math.cosh(v)));
        }
        degrees() {
            return derive(this, kleene((v) => v * (180 / Math.PI)));
        }
        div(val: number | IExpr | null) {
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                if (r == null || r === 0) return null;
                return v / r;
            }));
        }
        exp() {
            return derive(this, kleene((v) => Math.exp(v)));
        }
        expm1() {
            return derive(this, kleene((v) => Math.expm1(v)));
        }
        floor() {
            return derive(this, kleene((v) => Math.floor(v)));
        }
        floordiv(val: number | IExpr | null) {
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                if (r == null || r === 0) return null;
                return Math.floor(v / r);
            }));
        }
        hypot(val: number | IExpr | null) {
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : Math.hypot(v, r);
            }));
        }
        log(base: number = Math.E) {
            return derive(this, kleene((v) => {
                if (v <= 0) return null;
                return base === Math.E ? Math.log(v) : Math.log(v) / Math.log(base);
            }));
        }
        log1p() {
            return derive(this, kleene((v) => v <= -1 ? null : Math.log1p(v)));
        }
        mod(val: number | IExpr | null) {
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                if (r == null || r === 0) return null;
                return v % r;
            }));
        }
        mul(val: number | IExpr | null) {
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v * r;
            }));
        }
        negate() {
            return derive(this, kleene((v) => -v));
        }
        pow(val: number | IExpr | null) {
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : Math.pow(v, r);
            }));
        }
        radians() {
            return derive(this, kleene((v) => v * (Math.PI / 180)));
        }
        round(decimals: number = 0) {
            const factor = Math.pow(10, decimals);
            return derive(this, kleene((v) => Math.round(v * factor) / factor));
        }
        sin() {
            return derive(this, kleene((v) => Math.sin(v)));
        }
        sinh() {
            return derive(this, kleene((v) => Math.sinh(v)));
        }
        sign() {
            return derive(this, kleene((v) => Math.sign(v)));
        }
        sqrt() {
            return derive(this, kleene((v) => v < 0 ? null : Math.sqrt(v)));
        }
        tan() {
            return derive(this, kleene((v) => Math.tan(v)));
        }
        tanh() {
            return derive(this, kleene((v) => Math.tanh(v)));
        }
        trunc() {
            return derive(this, kleene((v) => Math.trunc(v)));
        }
        sub(val: number | IExpr | null) {
            return derive(this, kleene((v, row) => {
                const r = this._resolve(val, row);
                return r == null ? null : v - r;
            }));
        }
    };
};
