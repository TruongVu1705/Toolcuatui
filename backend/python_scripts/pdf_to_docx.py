import sys
import json
import os
import pymupdf  # fitz
from pdf2docx import Converter
import pytesseract
from PIL import Image
from docx import Document

def is_scanned_pdf(doc):
    """
    Check if a PDF is likely a scanned document by counting text characters.
    If total text is less than 50 characters, it's considered scanned.
    """
    total_text = 0
    for page in doc:
        text = page.get_text()
        total_text += len(text.strip())
        if total_text > 50:
            return False
    return True

def convert_scanned_pdf(doc, docx_file):
    """
    Convert a scanned PDF to a Word document using OCR.
    """
    # Initialize Word document
    word_doc = Document()
    
    # Use local Tesseract binary
    tesseract_cmd = os.path.join(os.path.dirname(__file__), '..', 'tesseract_bin', 'tesseract.exe')
    tesseract_cmd = os.path.abspath(tesseract_cmd)
    if os.path.exists(tesseract_cmd):
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    
    # Set tessdata path
    tessdata_dir = os.path.join(os.path.dirname(__file__), '..', 'tesseract_bin', 'tessdata')
    tessdata_dir = os.path.abspath(tessdata_dir)
    os.environ['TESSDATA_PREFIX'] = tessdata_dir

    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Render page to an image (pixmap) with 300 DPI for good OCR
        pix = page.get_pixmap(dpi=300)
        
        # Convert PyMuPDF pixmap to PIL Image
        mode = "RGBA" if pix.alpha else "RGB"
        img = Image.frombytes(mode, [pix.width, pix.height], pix.samples)
        
        # Perform OCR (using Vietnamese if available, fallback to eng)
        try:
            text = pytesseract.image_to_string(img, lang='vie')
        except Exception:
            text = pytesseract.image_to_string(img)
            
        # Add text to Word doc
        if text.strip():
            word_doc.add_paragraph(text.strip())
            
        # Add page break if not the last page
        if page_num < len(doc) - 1:
            word_doc.add_page_break()
            
    word_doc.save(docx_file)

def convert_pdf_to_docx(pdf_file, docx_file):
    try:
        # Open document with PyMuPDF to analyze it
        doc = pymupdf.open(pdf_file)
        
        # Determine if it is a scanned PDF
        is_scanned = is_scanned_pdf(doc)
        
        if is_scanned:
            # Handle scanned PDF with OCR
            convert_scanned_pdf(doc, docx_file)
            doc.close()
            print(json.dumps({"success": True, "output_file": docx_file, "method": "ocr"}))
        else:
            # Handle normal text-based PDF with pdf2docx for layout preservation
            doc.close()
            cv = Converter(pdf_file)
            cv.convert(docx_file, start=0, end=None)
            cv.close()
            print(json.dumps({"success": True, "output_file": docx_file, "method": "pdf2docx"}))
            
    except Exception as e:
        # Output error JSON
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing input or output file paths."}))
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]
    
    convert_pdf_to_docx(pdf_path, docx_path)
