const express = require("express");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const CryptoUtil = require("./utils");

const app = express();
const port = process.env.PORT;

const mongoUrl = process.env.MONGO_URL;

const client = new MongoClient(mongoUrl);

const cryptoUtil = new CryptoUtil();

let collection;

const connectToMongoDBServer = async () => {
    try {
        await client.connect();
        return client.db(process.env.DB_NAME).collection("users");
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

const ensureDBConnection = async (req, res, next) => {
    if (!collection) {
        await connectToMongoDBServer();
    }
    next();
};

app.use(express.json());
app.use(ensureDBConnection);

app.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Bad Request" });
        }

        const existingUser = await collection.findOne({ username });

        if (existingUser) {
            return res.status(409).json({ error: "Username already exists" });
        }

        const passwordHash = cryptoUtil.getPasswordHash(password);

        const token = cryptoUtil.generateRandomToken();

        const user = {
            username,
            passwordHash,
            token,
            data: req.body.data
        }

        await collection.insertOne(user);

        res.status(201).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Serer Error" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Bad Request" });
        }

        const user = await collection.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const passwordHash = cryptoUtil.getPasswordHash(password);

        if (passwordHash !== user.passwordHash) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const token = cryptoUtil.generateRandomToken();

        await collection.updateOne({ username }, { $set: { token }});

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error "});
    }
});

app.post("/forward_request", async (req, res) => {
    try {
        const { token, url, method, data } = req.body;

        if (!token || !url || !method || !data) {
            return res.status(400).json({ error: "Bad Request" });
        }

        const existingUser = await collection.findOne({ token });

        if (!existingUser) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        if (method === "GET") {
            const forwardRes = await axios.get(url);

            if (forwardRes.status === 200) {
                return res.status(200).json(forwardRes.data);
            }

            res.status(forwardRes.status).json({ error: forwardRes.statusText });
        }
        else if (method === "POST") {
            const forwardRes = await axios.post(url, data);

            if (forwardRes.status === 200) {
                return res.status(200).json(forwardRes.data);
            }

            res.status(forwardRes.status).json({ error: forwardRes.statusText });
        }
        else {
            res.status(405).json({ error: "Method Not Allowed" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error "});
    }
});

app.post("/update_password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ error: "Bad Request" });
        }

        const existingUser = await collection.findOne({ token });

        if (!existingUser) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        const newPasswordHash = cryptoUtil.getPasswordHash(newPassword);        

        await collection.updateOne({ token }, { $set: { passwordHash: newPasswordHash } });

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/delete_user", async (req, res) => {
    try {
        const { token, username } = req.body;

        if (!token || !username) {
            return res.status(400).json({ error: "Bad Request" });
        }

        const existingUser = await collection.findOne({ token });

        if (!existingUser) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        await collection.deleteOne({ token });

        return res.sendStatus(200);
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/update_user_data", async (req, res) => {
    try {
        const { token, data } = req.body;

        if (!token || !data) {
            return res.status(400).json({ error: "Bad Request" });
        }

        const existingUser = await collection.findOne({ token });

        if (!existingUser) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        await collection.updateOne({ token }, { $set: { data } });

        res.sendStatus(200);
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

app.post("/admin/delete_user", async (req, res) => {
    try {
        const { adminKey, username } = req.body;

        if (!adminKey || !username) {
            return res.status(400).json({ error: "Bad Request" });
        }
        else if (adminKey != process.env.ADMIN_KEY) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        await collection.deleteOne({ username });

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }

});

app.post("/admin/get_users", async (req, res) => {
    try {
        const { adminKey } = req.body;

        if (!adminKey) {
            return res.status(400).json({ error: "Bad Request" });
        }
        else if (adminKey != process.env.ADMIN_KEY) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        const users = await collection.find({}).toArray();

        res.status(200).json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

app.post("/admin/update_user_data", async (req, res) => {
    try {
        const { adminKey, username, data } = req.body;

        if (!adminKey || !data) {
            return res.status(400).json({ error: "Bad Request" });
        }
        else if (adminKey != process.env.ADMIN_KEY) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        await collection.updateOne({ username }, { $set: { data } });

        res.sendStatus(200);
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

const startServer = async () => {
    await connectToMongoDBServer();
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
};

startServer();