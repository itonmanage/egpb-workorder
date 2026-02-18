import * as XLSX from 'xlsx';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToExcel(data: any[], filename: string = 'export.xlsx') {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Calculate column widths based on content
    if (data.length > 0) {
        const firstRow = data[0];
        const colWidths = Object.keys(firstRow).map(key => {
            // Calculate max width for this column
            const maxContentLength = Math.max(
                key.length, // Header length
                ...data.map(row => String(row[key] || '').length) // Content length
            );
            return { wch: Math.min(Math.max(maxContentLength, 10), 50) }; // Min 10, Max 50 chars
        });
        worksheet['!cols'] = colWidths;
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, filename);
}
