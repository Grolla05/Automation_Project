from services.ocr_service import OCRService
from services.pdfExtract_service import PDFExtractService
from services.document_service import DocumentService
from services.excel_service import ExcelService
import threading

class ServiceRegistry:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ServiceRegistry, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.ocr_service = OCRService()
        self.pdf_extract_service = PDFExtractService()
        self.doc_service = DocumentService()
        self.excel_service = ExcelService()
        self._initialized = True

# Instância global protegida (Singleton)
services = ServiceRegistry()
