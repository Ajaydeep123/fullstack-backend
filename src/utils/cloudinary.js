/* 
Approach for file uploading, We'll use multer to get client to upload the file and store it temporarily in public/temp, 
once the file is uploaded to cloudinary we'll delete it using fs.unlinkSync()
*/

import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});
 
const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath) return null;
        //uplaoding on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        }) 
        //file uploaded 
        console.log("file uploaded on cloudinary: ", response.url);

        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}

export { uploadOnCloudinary }
