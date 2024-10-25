const AWS = require("aws-sdk");
const config = require("./config.json");

const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: "eu-west-3",
});

module.exports = s3;
