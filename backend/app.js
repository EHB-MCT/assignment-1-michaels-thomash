const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const config = require("./config.json");
const uploadRoute = require("./uploadRoute");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const url = config.final_url;
const dbName = "Webshop";
const collectionName = "Wallpapers";

app.use(cors());
app.use(uploadRoute);
app.use(express.json());

let db;
const client = new MongoClient(url);

client
	.connect()
	.then(() => {
		db = client.db("Webshop");
		console.log("MongoDB connected");
	})
	.catch((err) => {
		console.error("MongoDB connection error:", err.message);
		process.exit(1);
	});

app.get("/Wallpapers", async (req, res) => {
	try {
		await client.connect();
		const db = client.db(dbName);
		const collection = db.collection(collectionName);

		const wallpapers = await collection.find({}).toArray();
		res.json({
			message: "Successfully fetched all the wallpapers",
			data: wallpapers,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	} finally {
		await client.close();
	}
});

app.listen(PORT, () => {
	console.log("Server is running on http://localhost:${PORT}");
});
