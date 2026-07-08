function escapeCell(value) {
    const text = String(value ?? "");
    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

export function downloadSheet(filename, headers, rows) {
    const lines = [
        headers.map(escapeCell).join(","),
        ...rows.map((row) => row.map(escapeCell).join(",")),
    ];
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

export function buildMaterialSalesCsv(report, shopName = "Shop") {
    const lines = [];
    const pushRow = (cells) => lines.push(cells.map(escapeCell).join(","));

    pushRow(["JunkShop On-The-Go — Material Sales Report"]);
    pushRow(["Shop", shopName]);
    pushRow(["Period", report.meta?.periodLabel || ""]);
    pushRow(["Generated", report.meta?.generatedAt || new Date().toISOString()]);
    pushRow(["Note", report.meta?.note || ""]);
    pushRow([]);

    const headers = ["Category", "Material", "Unit", "Qty sold", "Revenue (PHP)", "Line items"];

    for (const section of report.sections || []) {
        pushRow([`=== ${section.label?.toUpperCase() || section.type} ===`]);
        pushRow(headers);

        if (!section.rows?.length) {
            pushRow(["No sales in this period"]);
        } else {
            for (const row of section.rows) {
                pushRow([
                    row.category,
                    row.material,
                    row.unit,
                    row.qtySold,
                    row.revenue,
                    row.transactions,
                ]);
            }

            pushRow([]);
            pushRow(["Category subtotals"]);
            pushRow(["Category", "Revenue (PHP)", "Line items"]);
            for (const total of section.categoryTotals || []) {
                pushRow([total.category, total.revenue, total.transactions]);
            }
        }

        pushRow([]);
    }

    const periodSlug = String(report.meta?.from || "report").replace(/[^\d-]/g, "");
    const filename = `material-sales_${periodSlug}.csv`;
    const csv = lines.join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
