const quote = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows: (string | number)[][]) => rows.map((row) => row.map(quote).join(',')).join('\n');

export function downloadTextFile(filename: string, content: string, mime = 'text/csv') {
    const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/** Column names match the create shipment form. Confirm them against the backend importer. */
export const shipmentTemplateCsv = toCsv([
    [
        'recipientName',
        'recipientPhone',
        'recipientEmail',
        'recipientAddress',
        'recipientLat',
        'recipientLng',
        'weightKg',
        'lengthCm',
        'widthCm',
        'heightCm',
        'priority',
        'deliveryWindowStart',
        'deliveryWindowEnd',
    ],
    [
        'Nimali Perera',
        '+94771234567',
        'nimali@example.com',
        '12 Galle Road, Colombo 03',
        6.9147,
        79.8523,
        2.4,
        30,
        20,
        12,
        'STANDARD',
        '2026-11-12T09:00:00Z',
        '2026-11-12T17:00:00Z',
    ],
]);