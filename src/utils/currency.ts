export const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat(currency === 'CLP' ? 'es-CL' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
    }).format(isNaN(amount) ? 0 : amount);
};
