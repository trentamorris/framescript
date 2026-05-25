export function isJsonString(input: unknown, allowPrimitives = false): input is string {
    if (typeof input !== "string") return false;
    const s = input.trim();
    if (s === "") return false;

    if (!allowPrimitives) {
        const isWrapped = (s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"));
        if (!isWrapped) return false;
    }

    try {
        JSON.parse(s);
        return true;
    } catch {
        return false;
    }
}

export function safeJsonParse(input: unknown): unknown {
    if (typeof input !== "string") return input;
    try {
        return JSON.parse(input);
    } catch {
        return input;
    }
}
