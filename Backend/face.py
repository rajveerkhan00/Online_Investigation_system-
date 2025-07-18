import cloudinary
import cloudinary.api
import cloudinary.uploader
import face_recognition
import cv2
import numpy as np
import urllib.request
import time

# -------------------- Configuration --------------------
cloudinary.config(
    cloud_name='your_cloud_name',
    api_key='your_api_key',
    api_secret='your_api_secret',
    secure=True
)

FOLDER_PREFIX = "user_uploads"  # Folder or tag in Cloudinary to fetch images from
MAX_IMAGES = 100  # Number of images to fetch

# Simulated user database with Cloudinary URLs of reference photos
users = [
    {
        "id": 1,
        "name": "Alice Smith",
        "email": "alice@example.com",
        "reference_image": "https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/alice.jpg"
    },
    {
        "id": 2,
        "name": "Bob Johnson",
        "email": "bob@example.com",
        "reference_image": "https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/bob.jpg"
    }
]

# -------------------- Helper Functions --------------------

def download_image(url):
    """Download image from a URL and return OpenCV image."""
    try:
        response = urllib.request.urlopen(url)
        image_data = np.asarray(bytearray(response.read()), dtype="uint8")
        image = cv2.imdecode(image_data, cv2.IMREAD_COLOR)
        return image
    except Exception as e:
        print(f"Error downloading image: {url} => {e}")
        return None

def get_face_encodings(image):
    """Convert image to RGB and get face encodings."""
    try:
        rgb_image = image[:, :, ::-1]  # BGR to RGB
        encodings = face_recognition.face_encodings(rgb_image)
        return encodings
    except Exception as e:
        print(f"Error encoding face: {e}")
        return []

def build_user_reference_encodings(users):
    """Create a list of user reference encodings."""
    references = []
    for user in users:
        print(f"Processing reference for user: {user['name']}")
        image = download_image(user["reference_image"])
        if image is None:
            continue
        encodings = get_face_encodings(image)
        if encodings:
            references.append((user, encodings[0]))
        else:
            print(f"❌ No face found in reference image for {user['name']}")
    return references

def compare_faces(known_encoding, unknown_encoding, tolerance=0.5):
    """Compare a known face with an unknown face."""
    result = face_recognition.compare_faces([known_encoding], unknown_encoding, tolerance)
    distance = face_recognition.face_distance([known_encoding], unknown_encoding)
    return result[0], distance[0]

def fetch_cloudinary_images(folder_prefix, max_results=100):
    """Fetch list of image URLs from Cloudinary folder."""
    try:
        resources = cloudinary.api.resources(
            type="upload",
            prefix=folder_prefix,
            resource_type="image",
            max_results=max_results
        )
        return resources.get("resources", [])
    except Exception as e:
        print(f"Error fetching Cloudinary resources: {e}")
        return []

# -------------------- Main Matching Logic --------------------

def main():
    print("🚀 Starting face recognition matching...\n")
    start_time = time.time()

    # Step 1: Build known face encodings
    known_faces = build_user_reference_encodings(users)
    if not known_faces:
        print("❌ No reference faces available. Exiting.")
        return

    # Step 2: Fetch Cloudinary images
    cloud_images = fetch_cloudinary_images(FOLDER_PREFIX, MAX_IMAGES)
    if not cloud_images:
        print("❌ No images found in Cloudinary.")
        return

    match_summary = []

    # Step 3: Process each image
    for image_info in cloud_images:
        image_url = image_info.get('secure_url')
        print(f"\n📷 Processing image: {image_url}")

        image = download_image(image_url)
        if image is None:
            print("❌ Failed to load image.")
            continue

        encodings = get_face_encodings(image)
        if not encodings:
            print("😕 No faces detected.")
            continue

        matched_users = []
        for unknown_encoding in encodings:
            for user, ref_encoding in known_faces:
                is_match, distance = compare_faces(ref_encoding, unknown_encoding)
                if is_match:
                    print(f"✅ Match: {user['name']} (distance: {distance:.2f})")
                    matched_users.append({
                        "name": user["name"],
                        "email": user["email"],
                        "distance": distance,
                        "image_url": image_url
                    })
                    break  # Stop after first match for this face
            else:
                print("❌ Face did not match any known user.")

        match_summary.extend(matched_users)

    # Step 4: Summary
    print("\n📝 Summary of Matches:")
    if match_summary:
        for match in match_summary:
            print(f"- {match['name']} ({match['email']}) matched in image: {match['image_url']} (distance: {match['distance']:.2f})")
    else:
        print("No matches found.")

    print(f"\n✅ Finished in {time.time() - start_time:.2f} seconds.")

# Run the script
if __name__ == "__main__":
    main()
