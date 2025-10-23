#!/usr/bin/env python3
"""
LabLens - AHS Lab Report OCR Parser

This script extracts text from AHS lab report PDFs using OCR technology.
It's designed specifically for Alberta Health Services lab report formats.

Requirements:
- pytesseract
- Pillow (PIL)
- pdf2image (with poppler) OR PyMuPDF (fitz) as fallback
- tesseract-ocr (system dependency)

Author: LabLens Development Team
Version: 1.0.0
"""

import sys
import json
import re
import os
import tempfile
import logging
import gc
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import io

try:
    import pytesseract
    from PIL import Image
    # Try PyMuPDF first (no poppler needed), then fallback to pdf2image
    try:
        import fitz  # PyMuPDF
        PDF_PROCESSOR = 'pymupdf'
    except ImportError:
        try:
            import pdf2image
            PDF_PROCESSOR = 'pdf2image'
        except ImportError:
            print(json.dumps({
                'error': 'No PDF processing library available',
                'message': 'Please install either pdf2image+poppler OR PyMuPDF: pip install PyMuPDF',
                'required_packages': ['pytesseract', 'Pillow', 'pdf2image OR PyMuPDF']
            }))
            sys.exit(1)
except ImportError as e:
    print(json.dumps({
        'error': 'Missing required dependencies',
        'message': f'Failed to import required package: {e}',
        'required_packages': ['pytesseract', 'Pillow', 'pdf2image OR PyMuPDF']
    }))
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class LabLensParser:
    """
    Parser for AHS lab reports using OCR technology
    """
    
    def __init__(self):
        """Initialize the parser with OCR configuration"""
        # Configure Tesseract OCR settings for medical documents
        self.tesseract_config = '--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,()[]{}:/- '
        
        # Enhanced OCR config for better accuracy with lab reports
        self.enhanced_config = '--oem 3 --psm 6 -c preserve_interword_spaces=1'
        
        # PDF processor to use
        self.pdf_processor = PDF_PROCESSOR
        logger.info(f"Using PDF processor: {self.pdf_processor}")
        
        # Common AHS lab report patterns
        self.lab_patterns = {
            'header_patterns': [
                r'Alberta Health Services',
                r'MyHealth Records',
                r'Laboratory Report',
                r'Lab Report'
            ],
            'test_value_patterns': [
                r'(\w+(?:\s+\w+)*)\s*:?\s*([0-9.]+)\s*([a-zA-Z/μ×°²³⁹¹²]+)?',
                r'(\w+(?:\s+\w+)*)\s+([0-9.]+)\s+([a-zA-Z/μ×°²³⁹¹²]+)',
                r'(\w+)\s*([0-9.]+)\s*([a-zA-Z/μ×°²³⁹¹²]+)?'
            ],
            'reference_range_patterns': [
                r'Reference:?\s*([0-9.]+)\s*-\s*([0-9.]+)',
                r'Ref\s*Range:?\s*([0-9.]+)\s*-\s*([0-9.]+)',
                r'Normal:?\s*([0-9.]+)\s*-\s*([0-9.]+)'
            ]
        }

    def _convert_pdf_to_images_pymupdf(self, pdf_path: str) -> List[Image.Image]:
        """
        Convert PDF to images using PyMuPDF (fallback method)
        
        Args:
            pdf_path (str): Path to the PDF file
            
        Returns:
            List[PIL.Image]: List of page images
        """
        try:
            import fitz
            
            doc = fitz.open(pdf_path)
            images = []
            
            # Limit pages for memory efficiency (max 5 pages on free tier)
            max_pages = min(len(doc), 5)
            
            for page_num in range(max_pages):
                page = doc.load_page(page_num)
                
                # Get page as image with lower resolution to save memory
                mat = fitz.Matrix(1.5, 1.5)  # Reduced from 2.0 for memory
                pix = page.get_pixmap(matrix=mat)
                
                # Convert to PIL Image
                img_data = pix.tobytes("ppm")
                img = Image.open(io.BytesIO(img_data))
                images.append(img)
                
                logger.info(f"Converted page {page_num + 1} using PyMuPDF")
            
            doc.close()
            return images
            
        except Exception as e:
            raise Exception(f"PyMuPDF conversion failed: {str(e)}")

    def _convert_pdf_to_images_pdf2image(self, pdf_path: str) -> List[Image.Image]:
        """
        Convert PDF to images using pdf2image (requires poppler)
        
        Args:
            pdf_path (str): Path to the PDF file
            
        Returns:
            List[PIL.Image]: List of page images
        """
        try:
            images = pdf2image.convert_from_path(
                pdf_path,
                dpi=300,  # High DPI for better OCR accuracy
                first_page=1,
                last_page=10  # Limit to first 10 pages for performance
            )
            return images
            
        except Exception as e:
            raise Exception(f"pdf2image conversion failed: {str(e)}")

    def extract_text_from_pdf(self, pdf_path: str) -> Dict:
        """
        Extract text from PDF using OCR
        
        Args:
            pdf_path (str): Path to the PDF file
            
        Returns:
            Dict: Extracted text and metadata
        """
        try:
            logger.info(f"Starting OCR extraction for: {pdf_path}")
            
            # Check if PDF file exists
            if not os.path.exists(pdf_path):
                raise FileNotFoundError(f"PDF file not found: {pdf_path}")
            
            try:
                # Convert PDF to images
                if self.pdf_processor == 'pymupdf':
                    images = self._convert_pdf_to_images_pymupdf(pdf_path)
                else:
                    images = self._convert_pdf_to_images_pdf2image(pdf_path)
            except Exception as pdf_error:
                # Specific handling for poppler-related errors
                error_msg = str(pdf_error).lower()
                if 'poppler' in error_msg or 'unable to get page count' in error_msg:
                    return {
                        'success': False,
                        'error': 'Poppler PDF utilities not found. Please install Poppler to process PDF files.',
                        'details': {
                            'issue': 'Missing Poppler dependency',
                            'solution': 'Download Poppler from: https://github.com/oschwartz10612/poppler-windows/releases/',
                            'instructions': [
                                '1. Download the latest Release-XX.XX.X.zip',
                                '2. Extract to C:\\tools\\poppler\\',
                                '3. Add C:\\tools\\poppler\\poppler-XX.XX.X\\bin to your PATH',
                                '4. Restart the application'
                            ]
                        },
                        'text': '',
                        'confidence': 0
                    }
                else:
                    raise pdf_error
            
            if not images:
                raise ValueError("No pages found in PDF")
            
            logger.info(f"Converted PDF to {len(images)} image(s)")
            
            # Extract text from each page
            extracted_pages = []
            total_confidence = 0
            
            for i, image in enumerate(images):
                logger.info(f"Processing page {i + 1}")
                
                # Preprocess image for better OCR
                processed_image = self._preprocess_image(image)
                
                # Extract text with confidence scores
                text_data = pytesseract.image_to_data(
                    processed_image,
                    config=self.enhanced_config,
                    output_type=pytesseract.Output.DICT
                )
                
                # Extract plain text
                page_text = pytesseract.image_to_string(
                    processed_image,
                    config=self.enhanced_config
                )
                
                # Calculate page confidence
                confidences = [int(conf) for conf in text_data['conf'] if int(conf) > 0]
                page_confidence = sum(confidences) / len(confidences) if confidences else 0
                
                extracted_pages.append({
                    'page_number': i + 1,
                    'text': page_text,
                    'confidence': page_confidence,
                    'word_count': len(page_text.split())
                })
                
                total_confidence += page_confidence
                
                logger.info(f"Page {i + 1} processed - Confidence: {page_confidence:.1f}%")
                
                # Free memory after each page
                del processed_image, text_data, page_text, confidences
                gc.collect()
            
            # Combine all text
            full_text = '\n\n'.join(page['text'] for page in extracted_pages)
            avg_confidence = total_confidence / len(images) if images else 0
            
            # Validate extracted text
            if not self._validate_ahs_document(full_text):
                logger.warning("Document may not be a valid AHS lab report")
            
            result = {
                'success': True,
                'text': full_text,
                'extractedText': full_text,  # Alias for compatibility
                'pages': extracted_pages,
                'metadata': {
                    'total_pages': len(images),
                    'total_characters': len(full_text),
                    'total_words': len(full_text.split()),
                    'average_confidence': avg_confidence,
                    'processing_method': 'OCR with pytesseract'
                },
                'confidence': avg_confidence
            }
            
            logger.info(f"OCR extraction completed successfully. Confidence: {avg_confidence:.1f}%")
            return result
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'text': '',
                'confidence': 0
            }

    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR accuracy (memory-optimized)
        
        Args:
            image (PIL.Image): Input image
            
        Returns:
            PIL.Image: Processed image
        """
        try:
            # Convert to grayscale
            if image.mode != 'L':
                image = image.convert('L')
            
            # Enhance contrast only (skip sharpening to save memory)
            from PIL import ImageEnhance
            
            # Increase contrast
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.3)
            
            # Only scale if really needed (reduced threshold)
            width, height = image.size
            if width < 800 or height < 1000:
                scale_factor = max(800 / width, 1000 / height)
                new_size = (int(width * scale_factor), int(height * scale_factor))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            return image
            
        except Exception as e:
            logger.warning(f"Image preprocessing failed: {e}, using original image")
            return image

    def _validate_ahs_document(self, text: str) -> bool:
        """
        Validate if the document appears to be an AHS lab report
        
        Args:
            text (str): Extracted text
            
        Returns:
            bool: True if appears to be AHS document
        """
        text_lower = text.lower()
        
        # Check for AHS indicators
        ahs_indicators = [
            'alberta health services',
            'ahs',
            'myhealth',
            'laboratory report',
            'lab report',
            'patient name',
            'date of birth',
            'reference range'
        ]
        
        found_indicators = sum(1 for indicator in ahs_indicators if indicator in text_lower)
        
        # Should have at least 3 indicators to be considered valid
        return found_indicators >= 3

    def parse_lab_tests(self, text: str) -> Dict:
        """
        Parse lab test results from extracted text
        
        Args:
            text (str): Extracted text from OCR
            
        Returns:
            Dict: Parsed lab test data
        """
        try:
            logger.info("Starting lab test parsing")
            
            # Clean and normalize text
            cleaned_text = self._clean_text(text)
            
            # Extract test results
            test_results = self._extract_test_results(cleaned_text)
            
            # Organize into panels (simplified for demo)
            panels = self._organize_into_panels(test_results)
            
            result = {
                'success': True,
                'panels': panels,
                'metadata': {
                    'tests_found': len(test_results),
                    'panels_identified': len(panels),
                    'parsing_method': 'Pattern-based extraction'
                }
            }
            
            logger.info(f"Parsing completed: {len(test_results)} tests found")
            return result
            
        except Exception as e:
            logger.error(f"Lab test parsing failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'panels': {}
            }

    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common OCR errors
        text = text.replace('|', 'I')  # Common OCR mistake
        text = text.replace('°', 'o')  # Degree symbol
        
        return text.strip()

    def _extract_test_results(self, text: str) -> List[Dict]:
        """Extract individual test results from text"""
        results = []
        
        # Demo pattern - would need to be more sophisticated for real AHS reports
        pattern = r'(\w+(?:\s+\w+)*)\s*:?\s*([0-9.]+)\s*([a-zA-Z/μ×°²³⁹¹²]+)?'
        
        for match in re.finditer(pattern, text):
            test_name = match.group(1).strip()
            value = float(match.group(2))
            unit = match.group(3) or ''
            
            # Skip obvious non-test results
            if len(test_name) < 3 or any(skip in test_name.lower() for skip in ['page', 'date', 'time', 'patient']):
                continue
            
            results.append({
                'name': test_name,
                'value': value,
                'unit': unit,
                'raw_match': match.group(0)
            })
        
        return results

    def _organize_into_panels(self, test_results: List[Dict]) -> Dict:
        """Organize test results into logical panels"""
        # Simplified panel organization for demo
        panels = {
            'general_tests': {
                'name': 'General Lab Tests',
                'description': 'Extracted lab test results',
                'tests': {}
            }
        }
        
        for i, test in enumerate(test_results[:10]):  # Limit for demo
            test_id = f"test_{i+1}"
            panels['general_tests']['tests'][test_id] = {
                'name': test['name'],
                'value': test['value'],
                'unit': test['unit'],
                'referenceRange': 'Not available',
                'flag': 'normal',  # Would need proper analysis
                'explanation': f"Analysis of {test['name']} levels in blood.",
                'category': 'general'
            }
        
        return panels


def main():
    """Main entry point for the OCR parser"""
    try:
        # Get PDF path from command line argument
        if len(sys.argv) != 2:
            raise ValueError("Usage: python parse.py <pdf_path>")
        
        pdf_path = sys.argv[1]
        
        # Validate file exists
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        # Initialize parser
        parser = LabLensParser()
        
        # Extract text from PDF
        ocr_result = parser.extract_text_from_pdf(pdf_path)
        
        if not ocr_result['success']:
            print(json.dumps(ocr_result))
            sys.exit(1)
        
        # Parse lab tests
        parsing_result = parser.parse_lab_tests(ocr_result['text'])
        
        # Combine results
        final_result = {
            'success': True,
            'text': ocr_result['text'],
            'extractedText': ocr_result['text'],
            'confidence': ocr_result['confidence'],
            'panels': parsing_result.get('panels', {}),
            'metadata': {
                **ocr_result.get('metadata', {}),
                **parsing_result.get('metadata', {}),
                'processing_completed_at': 'UTC timestamp would go here'
            }
        }
        
        # Output JSON result
        print(json.dumps(final_result, indent=2))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'text': '',
            'confidence': 0,
            'panels': {}
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == '__main__':
    main() 