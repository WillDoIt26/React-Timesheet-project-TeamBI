// routes/reports.js
const express = require('express');
const papaparse = require('papaparse');
const PDFDocument = require('pdfkit');
const { isAuthenticated } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { execute } = require('../db');
const router = express.Router();

// Helper function to generate a PDF table (simplified)
function generatePdfTable(doc, data) {
    const tableTop = 150;
    const rowHeight = 25;
    const colWidths = [120, 100, 150, 60]; // Date, Week Start, Project, Hours
    
    // Draw table headers
    doc.font('Helvetica-Bold');
    ['Date', 'Week Start', 'Project', 'Hours'].forEach((header, i) => {
        const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(header, x, tableTop, { width: colWidths[i], align: 'left' });
    });
    doc.font('Helvetica');

    // Draw table rows
    data.forEach((row, rowIndex) => {
        const y = tableTop + (rowIndex + 1) * rowHeight;
        const rowData = [
            row.ENTRY_DATE,
            row.WEEK_START,
            row.PROJECT_NAME,
            (row.HOURS || 0).toFixed(2)
        ];
        rowData.forEach((cell, i) => {
            const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
            doc.text(cell, x, y, { width: colWidths[i], align: 'left' });
        });
    });
}


router.get('/employee-timesheet', isAuthenticated, authorizeRoles('manager', 'admin'), async (req, res) => {
    const { employeeId, format } = req.query;

    if (!employeeId || !format || !['csv', 'pdf'].includes(format)) {
        return res.status(400).json({ error: 'Missing or invalid employeeId or format.' });
    }

    try {
        const userQuery = await execute("SELECT USERNAME FROM USERS WHERE ID = ?", [employeeId]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Selected employee not found.' });
        }
        const employeeName = userQuery.rows[0].USERNAME;

        // --- FINAL CORRECTED SQL LOGIC ---
        // This query now correctly starts from TIMESHEETS and LEFT JOINs to find entries
        // and projects. It only returns rows where an actual time entry exists (HOURS IS NOT NULL).
        const sql = `
            SELECT 
                TO_VARCHAR(E.DATE, 'YYYY-MM-DD') AS ENTRY_DATE,
                TO_VARCHAR(T.WEEK_START, 'YYYY-MM-DD') AS WEEK_START,
                COALESCE(P.NAME, 'Deleted Project') AS PROJECT_NAME,
                E.HOURS
            FROM
                TIMESHEETS T
            LEFT JOIN
                TIME_ENTRIES E ON T.TIMESHEET_ID = E.TIMESHEET_ID
            LEFT JOIN
                PROJECTS P ON E.PROJECT_ID = P.PROJECT_ID
            WHERE
                T.EMPLOYEE_ID = ? AND E.HOURS IS NOT NULL AND E.HOURS > 0
            ORDER BY
                T.WEEK_START DESC, E.DATE ASC;
        `;
        const { rows: reportData } = await execute(sql, [employeeId]);
        
        if (reportData.length === 0) {
            return res.status(404).json({ error: 'No time entries found for this employee.' });
        }
        
        const filename = `timesheet-report-${employeeName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.${format}`;

        if (format === 'csv') {
            const csvData = reportData.map(r => ({
                "Employee": employeeName,
                "Entry Date": r.ENTRY_DATE,
                "Week Starting": r.WEEK_START,
                "Project": r.PROJECT_NAME,
                "Hours": (r.HOURS || 0).toFixed(2)
            }));
            const csv = papaparse.unparse(csvData);
            res.header('Content-Type', 'text/csv');
            res.attachment(filename);
            res.send(csv);

        } else if (format === 'pdf') {
            res.attachment(filename);
            
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            doc.pipe(res);

            doc.fontSize(20).text('Timesheet Entry Report', { align: 'center' });
            doc.fontSize(14).text(`Employee: ${employeeName}`, { align: 'center' });
            doc.moveDown(2);

            generatePdfTable(doc, reportData);

            doc.end();
        }

    } catch (err) {
        console.error("Report generation error:", err);
        res.status(500).json({ error: 'Failed to generate report.' });
    }
});

module.exports = router;