export const cleanJson = (text: string): string => {
    if (!text) return "{}";
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    return (start !== -1 && end !== -1) ? text.substring(start, end + 1) : "{}";
};
