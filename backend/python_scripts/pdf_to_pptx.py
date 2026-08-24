import sys
import json
from spire.pdf import *

def convert_pdf_to_pptx(pdf_file, pptx_file):
    try:
        pdf = PdfDocument()
        pdf.LoadFromFile(pdf_file)
        
        # Save to PPTX
        pdf.SaveToFile(pptx_file, FileFormat.PPTX)
        pdf.Close()
        
        print(json.dumps({"success": True, "output_file": pptx_file, "method": "spire_pdf"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing input or output file paths."}))
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    pptx_path = sys.argv[2]
    
    convert_pdf_to_pptx(pdf_path, pptx_path)
