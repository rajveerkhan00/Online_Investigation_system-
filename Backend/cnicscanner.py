
import cv2
import pytesseract
import re
import os

# If you're on Windows, set this to the path where Tesseract is installed
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text_from_image(image_path):
    """Read image using OpenCV and extract text using Tesseract OCR."""
    try:
        image = cv2.imread(image_path)

        if image is None:
            print(f"❌ Failed to load image: {image_path}")
            return ""

        # Preprocess the image for better OCR results
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.medianBlur(gray, 3)
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Use pytesseract to extract text
        text = pytesseract.image_to_string(thresh)
        return text
    except Exception as e:
        print(f"Error during OCR: {e}")
        return ""

def find_cnic_numbers(text):
    """Use regex to find CNIC numbers in the text."""
    cnic_pattern = r"\b\d{5}-\d{7}-\d\b"
    matches = re.findall(cnic_pattern, text)
    return matches

def is_valid_cnic(cnic):
    """Check if CNIC is in valid format (could expand with checksum logic if needed)."""
    pattern = r"^\d{5}-\d{7}-\d$"
    return bool(re.match(pattern, cnic))

def scan_cnic_from_image(image_path):
    print(f"🔍 Scanning image: {image_path}")
    text = extract_text_from_image(image_path)
    if not text.strip():
        print("❌ No text found in image.")
        return

    print("\n📜 Extracted Text:\n-------------------")
    print(text)

    cnics_found = find_cnic_numbers(text)
    if not cnics_found:
        print("\n❌ No CNIC pattern found.")
        return

    print("\n✅ CNIC(s) Found:")
    for cnic in cnics_found:
        valid = is_valid_cnic(cnic)
        print(f" - {cnic} → {'Valid' if valid else 'Invalid'}")

# ------------------------ Run This ------------------------

if __name__ == "__main__":
    # Replace with your CNIC image path
    image_path = "sample_cnic.jpg"
    if not os.path.exists(image_path):
        print(f"⚠️ Image not found: {image_path}")
    else:
        scan_cnic_from_image(image_path)
