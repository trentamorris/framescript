import { isTypedArray, isPlainObj } from "./guards";
import { isValidDateObj } from "./date";

export type StripMode = "both" | "start" | "end";

export type StripCharsOptions = {
    /**
     * The strip mode: "both" (default), "start", or "end".
     */
    mode?: StripMode;
    /**
     * If true, returns an empty string instead of null when the result is empty or input is null.
     */
    returnStringOnNull?: boolean;
    /**
     * The maximum number of non-matching characters allowed to be skipped from the start
     * before a match block is found. Passing -1 or null means scan the full length.
     */
    maxScanStart?: number | null;
    /**
     * The maximum number of non-matching characters allowed to be skipped from the end
     * before a match block is found. Passing -1 or null means scan the full length.
     */
    maxScanEnd?: number | null;
    /**
     * The maximum number of non-contiguous matching blocks allowed to be stripped from the start.
     * Passing -1 or null means strip all matching blocks.
     */
    maxMatchesStart?: number | null;
    /**
     * The maximum number of non-contiguous matching blocks allowed to be stripped from the end.
     * Passing -1 or null means strip all matching blocks.
     */
    maxMatchesEnd?: number | null;
    /**
     * If true, trims standard whitespace first before performing character stripping.
     */
    trimFirst?: boolean;
    /**
     * Options that apply only when the characters parameter is a string (and not a RegExp).
     */
    stringOptions?: {
        /**
         * If true, treats the characters string as a literal substring rather than a set of characters.
         */
        literal?: boolean;
        /**
         * If true, performs case-insensitive character and substring matching.
         */
        caseInsensitive?: boolean;
    };
};

/**
 * Strips characters from the start, end, or both ends of a string.
 */
export function stripChars(
    str: string | null | undefined,
    characters: string | RegExp | null = null,
    {
        mode = "both",
        returnStringOnNull = false,
        maxScanStart = 1,
        maxScanEnd = 1,
        maxMatchesStart = 1,
        maxMatchesEnd = 1,
        trimFirst = false,
        stringOptions: { literal = false, caseInsensitive = false } = {}
    }: StripCharsOptions = {}
): string | null {
    if (str == null) {
        return returnStringOnNull ? "" : null;
    }

    const trimString = (s: string, m: StripMode = "both"): string => {
        if (m === "start") return s.trimStart();
        if (m === "end") return s.trimEnd();
        return s.trim();
    };

    let workStr = str;
    if (trimFirst && characters != null) {
        workStr = trimString(str, mode);
    }

    if (characters == null) {
        const result = trimString(workStr, mode);
        return (returnStringOnNull || result !== "") ? result : null;
    }

    const matches = characters instanceof RegExp
        ? (char: string) => characters.test(char)
        : (() => {
            const targetSet = new Set(caseInsensitive ? (characters as string).toLowerCase() : characters);
            return (char: string) => targetSet.has(caseInsensitive ? char.toLowerCase() : char);
        })();

    const len = workStr.length;
    const stripped = new Uint8Array(len);

    type ScanArgs = {
        isStart: boolean;
        limit: number | null;
        maxMatches: number | null;
    };

    const scanNonLiteral = ({ isStart, limit, maxMatches }: ScanArgs) => {
        if (len === 0 || maxMatches === 0) {
            return;
        }

        const start = isStart ? 0 : len - 1;
        const end = isStart ? len : -1;
        const step = isStart ? 1 : -1;

        let inBlock = false;
        let matchesFound = 0;
        let totalSkipped = 0;

        for (let i = start; i !== end; i += step) {
            if (matches(workStr[i])) {
                if (!inBlock) {
                    if (limit !== null && limit >= 0 && totalSkipped >= limit) {
                        break;
                    }
                    if (maxMatches !== null && maxMatches >= 0 && matchesFound >= maxMatches) {
                        break;
                    }
                    inBlock = true;
                    matchesFound++;
                }
                stripped[i] = 1;
            } else {
                inBlock = false;
                totalSkipped++;
            }
        }
    };

    const scanLiteral = ({ isStart, limit, maxMatches }: ScanArgs) => {
        if (len === 0 || maxMatches === 0) {
            return;
        }
        const patLen = (characters as string).length;
        if (patLen === 0) {
            return;
        }

        const searchStr = caseInsensitive ? workStr.toLowerCase() : workStr;
        const patStr = caseInsensitive ? (characters as string).toLowerCase() : (characters as string);

        let currentIdx = isStart ? 0 : len - 1;
        let matchesFound = 0;
        let totalSkipped = 0;

        while (currentIdx >= 0 && currentIdx < len) {
            if (maxMatches !== null && maxMatches >= 0 && matchesFound >= maxMatches) {
                break;
            }

            const searchStart = isStart ? currentIdx : (currentIdx - patLen + 1);
            if (!isStart && searchStart < 0) {
                break;
            }

            const matchIdx = isStart
                ? searchStr.indexOf(patStr, searchStart)
                : searchStr.lastIndexOf(patStr, searchStart);

            if (matchIdx === -1) {
                break;
            }

            const skippedInThisStep = isStart
                ? (matchIdx - currentIdx)
                : (currentIdx - (matchIdx + patLen - 1));
            totalSkipped += skippedInThisStep;

            if (limit !== null && limit >= 0 && totalSkipped >= limit) {
                break;
            }

            for (let i = 0; i < patLen; i++) {
                stripped[matchIdx + i] = 1;
            }
            matchesFound++;
            currentIdx = isStart ? (matchIdx + patLen) : (matchIdx - 1);
        }
    };

    const isLiteral = literal && typeof characters === "string";
    const scan = isLiteral ? scanLiteral : scanNonLiteral;

    if (mode === "both" || mode === "start") {
        scan({ isStart: true, limit: maxScanStart, maxMatches: maxMatchesStart });
    }
    if (mode === "both" || mode === "end") {
        scan({ isStart: false, limit: maxScanEnd, maxMatches: maxMatchesEnd });
    }

    let result = "";
    for (let i = 0; i < len; i++) {
        if (stripped[i] === 0) {
            result += workStr[i];
        }
    }
    return (returnStringOnNull || result !== "") ? result : null;
}

export function isBlankString(v: unknown): v is string {
    if (typeof v === "string") {
        return v.trim().length === 0;
    }
    if (v instanceof String) {
        return v.valueOf().trim().length === 0;
    }
    return false;
}

export function toCanonicalString(
    val: any,
    { depth = 0, maxDepth = 50 }: { depth?: number; maxDepth?: number } = {}
): string {
    if (depth > maxDepth) {
        return "v:circular";
    }
    if (val === null) {
        return "v:null";
    }
    if (val === undefined) {
        return "v:undefined";
    }

    if (val instanceof Date) {
        return isValidDateObj(val) ? `d:${val.getTime()}` : "d:invalid";
    }

    if (isTypedArray(val)) {
        return `u:${val.constructor.name}:${val.toString()}`;
    }

    if (Array.isArray(val)) {
        const len = val.length;
        const parts = new Array(len);
        const nextOpt = { depth: depth + 1, maxDepth };
        for (let i = 0; i < len; i++) {
            parts[i] = toCanonicalString(val[i], nextOpt);
        }
        return `a:[${parts.join(",")}]`;
    }

    if (val instanceof Set) {
        const arr = Array.from(val);
        const len = arr.length;
        const parts = new Array(len);
        const nextOpt = { depth: depth + 1, maxDepth };
        for (let i = 0; i < len; i++) {
            parts[i] = toCanonicalString(arr[i], nextOpt);
        }
        parts.sort();
        return `set:[${parts.join(",")}]`;
    }

    if (val instanceof Map) {
        const keys = Array.from(val.keys());
        const len = keys.length;
        const parts = new Array(len);
        const nextOpt = { depth: depth + 1, maxDepth };
        for (let i = 0; i < len; i++) {
            const k = keys[i];
            parts[i] = `${toCanonicalString(k, nextOpt)}:${toCanonicalString(val.get(k), nextOpt)}`;
        }
        parts.sort();
        return `map:{${parts.join(",")}}`;
    }

    if (typeof val === "object" && typeof val.toJSON === "function") {
        return `j:${toCanonicalString(val.toJSON(), { depth: depth + 1, maxDepth })}`;
    }

    if (isPlainObj(val)) {
        const keys = Object.keys(val).sort();
        const len = keys.length;
        const parts = new Array(len);
        const nextOpt = { depth: depth + 1, maxDepth };
        for (let i = 0; i < len; i++) {
            const k = keys[i];
            parts[i] = `${k}:${toCanonicalString(val[k], nextOpt)}`;
        }
        return `o:{${parts.join(",")}}`;
    }

    if (val instanceof RegExp) {
        return `r:${val.toString()}`;
    }

    if (typeof val === "function") {
        return `f:${val.toString()}`;
    }

    if (typeof val === "string") {
        return `s:${val}`;
    }

    if (typeof val === "symbol") {
        return `y:${val.toString()}`;
    }

    return `${typeof val}:${val}`;
}
