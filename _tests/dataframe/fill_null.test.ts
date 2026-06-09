import { DataFrame } from "../../src";

console.log("Running fill_null tests...");

const df = new DataFrame({
    a: [1, null, 3, null, 5],
    b: [null, "x", null, "y", null],
    c: [true, null, false, true, null]
});

// 1. Constant value filling
const resConst = df.fill_null({ value: 99 });
const dictsConst = resConst.to_dicts();
if (dictsConst[1].a !== 99 || dictsConst[0].b !== "99" || dictsConst[1].c !== "99") {
    throw new Error("Constant value fill_null failed");
}

// 2. Strategies: "zero" and "one"
const resZero = df.fill_null({ strategy: "zero" });
const dictsZero = resZero.to_dicts();
if (dictsZero[1].a !== 0 || dictsZero[0].b !== "0" || dictsZero[1].c !== "0") {
    throw new Error("Zero strategy fill_null failed");
}

const resOne = df.fill_null({ strategy: "one" });
const dictsOne = resOne.to_dicts();
if (dictsOne[1].a !== 1 || dictsOne[0].b !== "1" || dictsOne[1].c !== "1") {
    throw new Error("One strategy fill_null failed");
}

// 3. Aggregate strategies: "min", "max", and "mean"
const dfNumeric = new DataFrame({
    a: [2, null, 6, null, 10] // min: 2, max: 10, mean: 6
});

const resMin = dfNumeric.fill_null({ strategy: "min" });
if (resMin.item(1, "a") !== 2 || resMin.item(3, "a") !== 2) {
    throw new Error("Min strategy fill_null failed");
}

const resMax = dfNumeric.fill_null({ strategy: "max" });
if (resMax.item(1, "a") !== 10 || resMax.item(3, "a") !== 10) {
    throw new Error("Max strategy fill_null failed");
}

const resMean = dfNumeric.fill_null({ strategy: "mean" });
if (resMean.item(1, "a") !== 6 || resMean.item(3, "a") !== 6) {
    throw new Error("Mean strategy fill_null failed");
}

// 4. Sequence propagation: "forward" and "backward"
const dfSeq = new DataFrame({
    a: [1, null, null, 4, null]
});

// Forward-fill without limit
const resFwd = dfSeq.fill_null({ strategy: "forward" });
if (
    resFwd.item(1, "a") !== 1 ||
    resFwd.item(2, "a") !== 1 ||
    resFwd.item(4, "a") !== 4
) {
    throw new Error("Forward strategy fill_null without limit failed");
}

// Forward-fill with limit = 1
const resFwdLimit = dfSeq.fill_null({ strategy: "forward", limit: 1 });
if (
    resFwdLimit.item(1, "a") !== 1 ||
    resFwdLimit.item(2, "a") !== null || // limited
    resFwdLimit.item(4, "a") !== 4
) {
    throw new Error("Forward strategy fill_null with limit failed");
}

// Backward-fill without limit
const resBwd = dfSeq.fill_null({ strategy: "backward" });
if (
    resBwd.item(1, "a") !== 4 ||
    resBwd.item(2, "a") !== 4 ||
    resBwd.item(4, "a") !== null // no next value
) {
    throw new Error("Backward strategy fill_null without limit failed");
}

// Backward-fill with limit = 1
const resBwdLimit = dfSeq.fill_null({ strategy: "backward", limit: 1 });
if (
    resBwdLimit.item(1, "a") !== null || // limited (distance is 2 index steps backward to 4)
    resBwdLimit.item(2, "a") !== 4 || // within limit of 1
    resBwdLimit.item(4, "a") !== null
) {
    throw new Error("Backward strategy fill_null with limit failed");
}

// 5. Empty DataFrame boundary case
const dfEmpty = new DataFrame({ a: [] });
const resEmpty = dfEmpty.fill_null({ value: 99 });
if (resEmpty.height !== 0) {
    throw new Error("Empty DataFrame fill_null height should be 0");
}

console.log("✓ fill_null tests passed!");
