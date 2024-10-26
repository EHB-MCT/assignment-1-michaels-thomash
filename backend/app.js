const express = require("express");
const { v4: uuidv4, validate: uuidValidate } = require("uuid");
const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const config = require("./config.json");
const uploadRoute = require("./uploadRoute");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const url = config.final_url;
const dbName = "Webshop";
const usersCollection = "Users"; 
const wallpapersCollection = "Wallpapers"; 

app.use(cors());
app.use(uploadRoute);
app.use(express.json());
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const sessionToken = authHeader.substring(7);
        const userSession = Object.entries(activeSessions).find(([_, session]) => session.token === sessionToken);
        if (userSession) {
            req.user = {
                id: userSession[0],
                ...userSession[1]
            };
        }
    }
    next();
});

let db;
const client = new MongoClient(url);

client
	.connect()
	.then(() => {
		db = client.db(dbName);
		console.log("MongoDB connected");
	})
	.catch((err) => {
		console.error("MongoDB connection error:", err.message);
		process.exit(1);
	});	

let activeSessions = {};

app.post("/logout", async (req, res) => {
    if (!req.user) {
        return res.status(401).send({
            status: "Auth Error",
            message: "You must be logged in to logout"
        });
    }

    delete activeSessions[req.user.id];

    res.status(200).send({
        status: "Logged Out",
        message: "You have successfully logged out"
    });
});

app.post("/login", async (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({
            status: "Bad Request",
            message: "Some fields are missing",
        });
    }

    try {
        const collection = db.collection(usersCollection);
        const user = await collection.findOne({ email: req.body.email });

        if (user) {
            const validPassword = await bcrypt.compare(req.body.password, user.password);
            if (validPassword) {
                const sessionToken = uuidv4();
                activeSessions[user.id] = { 
                    email: user.email,
                    token: sessionToken 
                };

                res.status(200).send({
                    status: "Auth Success",
                    message: "You are logged in!",
                    data: {
                        username: user.username,
                        email: user.email,
                        uuid: user.uuid,
                        token: sessionToken
                    },
                });
            } else {
                res.status(401).send({
                    status: "Auth Error",
                    message: "Password incorrect",
                });
            }
        } else {
            res.status(401).send({
                status: "Auth Error",
                message: "No user with this email has been found!",
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            error: "Something went wrong!",
            value: error.message || error,
        });
    }
});

app.post("/register", async (req, res) => {
	console.log(req.body);

	if (!req.body.username || !req.body.email || !req.body.password) {
		return res.status(400).send({
			status: "Bad Request",
			message: "Some fields are missing"
		});
	}

	try {
		const customId = await getNextSequenceValue("userId");

		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		const user = {
			id: customId,           
			username: req.body.username,
			email: req.body.email,
			password: hashedPassword,
			uuid: uuidv4(),
			subscription: "free",      
			purchaseHistory: [],        
			downloadHistory: [],        
			favorites: [],              
			dateJoined: new Date(),      
			description: ""
		};

		const insertedUser = await db.collection(usersCollection).insertOne(user);

		res.status(200).send({
			status: "Saved",
			message: "User has been saved!",
			data: insertedUser
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({
			error: 'Something went wrong!',
			value: error
		});
	}
});

async function getNextSequenceValue(sequenceName) {
    try {
        let sequenceDocument = await db.collection("Counters").findOne({ _id: sequenceName });

        if (!sequenceDocument) {
            sequenceDocument = { _id: sequenceName, sequenceValue: 0 };
            await db.collection("Counters").insertOne(sequenceDocument);
        }

        const result = await db.collection("Counters").findOneAndUpdate(
            { _id: sequenceName },
            { $inc: { sequenceValue: 1 } },
            { 
                returnDocument: 'after',
                upsert: true 
            }
        );

        console.log("Raw result from findOneAndUpdate:", result);

        if (!result) {
            throw new Error("No result returned from findOneAndUpdate");
        }

        const updatedSequenceValue = result.sequenceValue;

        if (typeof updatedSequenceValue !== 'number') {
            throw new Error("Invalid sequence value returned");
        }

        console.log("Successfully generated new sequence value:", updatedSequenceValue);
        return updatedSequenceValue;
    } catch (error) {
        console.error("Error in getNextSequenceValue:", error);
        throw error;
    }
}

app.post("/verifyID", async (req, res) => {
    if (!req.body.uuid) {
        return res.status(400).send({
            status: "Bad Request",
            message: "ID is missing"
        });
    }

    if (!uuidValidate(req.body.uuid)) {
        return res.status(400).send({
            status: "Bad Request",
            message: "ID is not a valid UUID"
        });
    }

    try {
        const collection = db.collection(usersCollection);
        const user = await collection.findOne({ uuid: req.body.uuid });

        if (user) {
            res.status(200).send({
                status: "Verified",
                message: "Your UUID is valid",
                data: {
                    username: user.username,
                    email: user.email,
                    uuid: user.uuid,
                }
            });
        } else {
            res.status(401).send({
                status: "Verify Error",
                message: `No user exists with ID: ${req.body.uuid}`
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong!',
            value: error
        });
    }
});
<<<<<<< HEAD

=======
>>>>>>> 1ce5749 (feat(api): add user authentication endpoint)

app.get("/Wallpapers", async (req, res) => {
	try {
		const collection = db.collection(wallpapersCollection);
		const wallpapers = await collection.find({}).toArray();
		res.json({
			message: "Successfully fetched all the wallpapers",
			data: wallpapers,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
