export const parseStrictNumber = (val: any): number => {
    const clean = String(val).replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
};

export const getSafeDate = (val: any): string => {
    const today = new Date().toISOString().split('T')[0];
    if (val && typeof val.toDate === 'function') {
        try {
            return val.toDate().toISOString().split('T')[0];
        } catch (e) {
            return today;
        }
    }
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    return today;
};
