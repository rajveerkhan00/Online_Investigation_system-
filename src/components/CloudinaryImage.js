import React from "react";
import cld from "../cloudinaryConfig"; // ✅ Import Cloudinary instance
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { AdvancedImage } from "@cloudinary/react";

const CloudinaryImage = () => {
  // Load and transform an image
  const img = cld
    .image("cld-sample-5")
    .format("auto")
    .quality("auto")
    .resize(auto().gravity(autoGravity()).width(500).height(500));

  return (
    <div className="my-6 flex justify-center">
      <AdvancedImage cldImg={img} />
    </div>
  );
};

export default CloudinaryImage;
