export const exportToCSV = (data: any[], filename: string): void => {
    if (!data || data.length === 0) {
        alert("No data");
        return;
    }
    const headers = ["Date", "Merchant", "Alias", "Category", "Total", "Items"];
    const rows = data.map(t => [
        t.date,
        `"${(t.merchant || "").replace(/"/g, '""')}"`,
        `"${(t.alias || "").replace(/"/g, '""')}"`,
        t.category,
        t.total,
        t.items?.length || 0
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
