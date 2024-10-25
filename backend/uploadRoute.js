const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("./s3");
const config = require("./config.json");

const router = express.Router();

const upload = multer({
	storage: multerS3({
		s3: s3,
		bucket: config.aws.bucketName,
		acl: "public-read",
		key: (req, file, cb) => {
			cb(null, Date.now().toString() + "-" + file.originalname);
		},
	}),
});

router.post("/upload", upload.single("wallpaper"), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: "No file uploaded" });
	}

	res.json({
		message: "Wallpaper uploaded successfully",
		imageUrl: req.file.location,
	});
});

module.exports = router;
