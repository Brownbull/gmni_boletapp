export const formatDate = (dateStr: string, format: 'LatAm' | 'US'): string => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    if (format === 'US') return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // LatAm default
};
