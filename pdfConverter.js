const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const PptxGenJS = require('pptxgenjs');

// Helper to extract text from PDF if needed for PPTX
let PDFParseClass = null;
try {
    const mod = require('pdf-parse');
    PDFParseClass = mod.PDFParse || mod;
} catch (e) {
    console.log('pdf-parse module not loaded');
}

async function extractPdfText(pdfBuffer) {
    if (!pdfBuffer || pdfBuffer.length === 0) return '';
    if (PDFParseClass) {
        try {
            if (typeof PDFParseClass === 'function' && PDFParseClass.prototype && PDFParseClass.prototype.getText) {
                const parser = new PDFParseClass({ data: pdfBuffer });
                const res = await parser.getText();
                if (res && res.text && res.text.trim().length > 0) return res.text;
            } else if (typeof PDFParseClass === 'function') {
                const res = await PDFParseClass(pdfBuffer);
                if (res && res.text && res.text.trim().length > 0) return res.text;
            }
        } catch (e) {
            console.error('PDF extraction failed:', e.message);
        }
    }
    return '';
}

/**
 * Convert PDF buffer to DOCX using Python pdf2docx
 */
async function convertPdfToDocx(pdfBuffer, originalFilename = 'document.pdf') {
    return new Promise((resolve, reject) => {
        // Create temp files
        const tempId = crypto.randomBytes(16).toString('hex');
        const tempPdfPath = path.join(os.tmpdir(), `${tempId}.pdf`);
        const tempDocxPath = path.join(os.tmpdir(), `${tempId}.docx`);

        // Python executable path (Tương thích Linux/Docker và Windows)
        const isWin = process.platform === 'win32';
        const pythonPath = isWin 
            ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe')
            : 'python3';
        const scriptPath = path.join(__dirname, 'backend', 'python_scripts', 'pdf_to_docx.py');

        // Write PDF buffer to temp file
        fs.writeFile(tempPdfPath, pdfBuffer, (err) => {
            if (err) return reject(err);

            // Execute Python script
            execFile(pythonPath, [scriptPath, tempPdfPath, tempDocxPath], (error, stdout, stderr) => {
                let parseError = null;
                let result = null;
                
                try {
                    // Try to parse JSON from python script output
                    const lines = stdout.trim().split('\n');
                    const lastLine = lines[lines.length - 1];
                    result = JSON.parse(lastLine);
                } catch (e) {
                    parseError = new Error(`Failed to parse python output: ${stdout}. Stderr: ${stderr}`);
                }

                if (error || parseError || (result && !result.success)) {
                    console.error("Python conversion error:", error || parseError || result.error);
                    // Cleanup
                    fs.unlink(tempPdfPath, () => {});
                    fs.unlink(tempDocxPath, () => {});
                    return reject(error || parseError || new Error(result.error));
                }

                // Read the generated DOCX file
                fs.readFile(tempDocxPath, (readErr, docxBuffer) => {
                    // Cleanup
                    fs.unlink(tempPdfPath, () => {});
                    fs.unlink(tempDocxPath, () => {});

                    if (readErr) return reject(readErr);
                    resolve(docxBuffer);
                });
            });
        });
    });
}

/**
 * Convert PDF buffer to a valid Microsoft PowerPoint (.pptx) Buffer
 * Since there is no simple 1-to-1 PDF to PPTX, we extract text and arrange in slides
 */
async function convertPdfToPptx(pdfBuffer, originalFilename = 'presentation.pdf') {
    return new Promise((resolve, reject) => {
        // Create temp files
        const tempId = crypto.randomBytes(16).toString('hex');
        const tempPdfPath = path.join(os.tmpdir(), `${tempId}.pdf`);
        const tempPptxPath = path.join(os.tmpdir(), `${tempId}.pptx`);

        // Python executable path (Tương thích Linux/Docker và Windows)
        const isWin = process.platform === 'win32';
        const pythonPath = isWin 
            ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe')
            : 'python3';
        const scriptPath = path.join(__dirname, 'backend', 'python_scripts', 'pdf_to_pptx.py');

        // Write PDF buffer to temp file
        fs.writeFile(tempPdfPath, pdfBuffer, (err) => {
            if (err) return reject(err);

            // Execute Python script
            execFile(pythonPath, [scriptPath, tempPdfPath, tempPptxPath], (error, stdout, stderr) => {
                let parseError = null;
                let result = null;
                
                try {
                    // Try to parse JSON from python script output
                    const lines = stdout.trim().split('\n');
                    const lastLine = lines[lines.length - 1];
                    result = JSON.parse(lastLine);
                } catch (e) {
                    parseError = new Error(`Failed to parse python output: ${stdout}. Stderr: ${stderr}`);
                }

                if (error || parseError || (result && !result.success)) {
                    console.error("Python PPTX conversion error:", error || parseError || result.error);
                    // Cleanup
                    fs.unlink(tempPdfPath, () => {});
                    fs.unlink(tempPptxPath, () => {});
                    return reject(error || parseError || new Error(result.error));
                }

                // Read the generated PPTX file
                fs.readFile(tempPptxPath, (readErr, pptxBuffer) => {
                    // Cleanup
                    fs.unlink(tempPdfPath, () => {});
                    fs.unlink(tempPptxPath, () => {});

                    if (readErr) return reject(readErr);
                    resolve(pptxBuffer);
                });
            });
        });
    });
}

module.exports = {
    convertPdfToDocx,
    convertPdfToPptx
};
