import cloudinary from "cloudinary";

// cloudinary.config({
//   cloud_name: "dagr7s5gm",
//   api_key: "122883568814297",
//   api_secret: "XtU8LeiMzMy9SzBNGoL9-WWSLus",
// });
// import db from "../models/index.js";
// const Image = db.image;

// const getImages = async (req, res) => {
//   const { name } = req?.params;
//   console.log("Image Name - ", name);
//   const image = await Image.findOne({ name });
//   if (!image) {
//     return res.status(404).json({ success: false, message: 'Image not found.' });
//   }
//   const base64ImageData = Buffer.from(image.data).toString("base64");
//   console.log("Images - ", image);

//   // res.set('Content-Type', image.contentType);
//   return res.status(200).send({
//     success: true,
//     message: 'Get image successfully',
//     imageName: image.name,
//     base64: `data:${image.contentType};base64,${base64ImageData}`,
//   });
// }

const addImages = async (req, res) => {
  const imageFile = req.files.image; // Retrieve the image file from the request
  const imageFilePath = imageFile.tempFilePath; // Get the temporary file path

  // Upload the image to Cloudinary
  cloudinary.uploader.upload(imageFilePath, (result) => {
    if (result.error) {
      console.error("Upload failed:", result.error);
      res.status(500).send("Upload failed");
      return;
    }

    // Send the image URL and public ID in the response
    const imageUrl = result.secure_url;
    const publicId = result.public_id;
    res.status(200).send({ imageUrl, publicId });
  });
};

// const uploadImages = async (file) => {
//   const image = new Image({
//     name: file.originalname,
//     data: file.buffer,
//     contentType: file.mimetype,
//   });
//     let response = await image.save();
//     console.log("Response from image - ", response.name);
//     return response?.name
// }

// const multipleImage = async (req, res) => {
//   if (!req.files) {
//     return res.status(400).json({ success: false, message: 'No file provided.' });
//   }

//   let files = req.files;
//   let promiseArray = []
//   if (files.length > 0) {
//     files.map(async file => {
//       let singlePromise = uploadImages(file)
//       promiseArray.push(singlePromise);
//     })
//   }
//   else {
//     return res.status(400).json({ success: false, message: 'No file provided.' });
//   }
//   try {
//     let responseFromAllPromise = await Promise.all(promiseArray);
//     console.log("Response from promise - ", responseFromAllPromise);
//     return res.status(201).json({
//       success: true,
//       message: `${responseFromAllPromise.length} images uploaded successfully`,
//       data: responseFromAllPromise
//     });
//   }
//   catch(err) {
//     console.log("error while promise all - ", err);
//     return res.status(400).json({
//       success: false,
//       message: 'Images uploading failed',
//       error: err?.message
//     });
//   }
// }

// const imagesController = {
//   addImages: addImages,
//   getImages: getImages,
//   multipleImage: multipleImage
// }

// export default imagesController;

const imageUpload = async (req, res) => {
  // Get the uploaded image file
  console.log("req - ", req);
  const file = req.body.image;

  try {
    let resposne = await cloudinary.v2.uploader.upload(file, {
      // folder: 'your_folder_name', // Optional
      // public_id: 'your_public_id', // Optional
    });

    console.log("Resposne from image uploading - ", resposne?.url);

    res
      .status(200)
      .json({ message: "Image uploaded successfully", url: resposne?.url });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    res.status(500).json({ message: "Error uploading image" });
  }
};

const imagesController = {
  addImages: addImages,
  // getImages: getImages,
  // multipleImage: multipleImage
  imageUpload: imageUpload,
};

export default imagesController;
