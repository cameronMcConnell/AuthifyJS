const express = require("express");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const CryptoUtil = require("./utils");
const AWS = require("aws-sdk");

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const ses = new AWS.SES();

const app = express();
const port = process.env.PORT;

const mongoUrl = process.env.MONGO_URL;

const client = new MongoClient(mongoUrl);

const cryptoUtil = new CryptoUtil();

let usersCollection, unverifiedUsersCollection;

const connectToMongoDBServer = async () => {
    try {
        await client.connect();
        usersCollection = client.db(process.env.DB_NAME).collection("users");
        unverifiedUsersCollection = client.db(process.env.DB_NAME).collection("unverifiedUsers");
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

const sendEmailVerification = async (username, userEmail, verificationCode) => {
    const params = {
        Destination: {
            ToAddresses: [userEmail]
        },
        Message: {
            Subject: {
                Data: `Your Verification Code for ${process.env.SERVICE_NAME}`,
                Charset: "UTF-8",
            },
            Body: {
                Text: {
                    Data: `Dear ${username},

                    Thank you for registering with ${process.env.SERVICE_NAME}! To complete your registration, please use the following verification code:

                    Your Verification Code: ${verificationCode}

                    Please enter this code in the verification field on our website to activate your account.

                    If you did not sign up for an account with ${process.env.SERVICE_NAME}, please ignore this email.

                    Thank you,
                    The ${process.env.SERVICE_NAME} Team`
                },
                Charset: "UTF-8",
            }
        },
        Source: process.env.SES_VERIFIED_EMAIL,
    }

    try {
        await ses.sendEmail(params).promise();
    } catch (error) {
        throw error;
    }
}

app.post("/signup", async (req, res) => {
    try {
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ error: "Bad Request" });
        }

        const unverifiedUser = await unverifiedUsersCollection.findOne({ username });

        if (unverifiedUser) {
            const passwordHash = cryptoUtil.getPasswordHash(password);
            
            if (passwordHash === unverifiedUser.passwordHash) {
                const verificationCode = cryptoUtil.generateVerificationCode();
                
                await unverifiedUsersCollection.updateOne({ username }, { $set: { verificationCode } })
                
                await sendEmailVerification(username, email, verificationCode);

                return res.status(403).json({ error: "User not verified", verify: true });
            }
            else {
                return res.status(409).json({ error: "Username already exists" });
            }
        }

        const verifiedUser = await usersCollection.findOne({ username });

        if (verifiedUser) {
            return res.status(409).json({ error: "Username already exists" });
        }

        const passwordHash = cryptoUtil.getPasswordHash(password);

        const verificationCode = cryptoUtil.generateVerificationCode();

        const user = {
            username,
            passwordHash,
            verificationCode,
            email
        }

        await sendEmailVerification(username, email, verificationCode);

        await unverifiedUsersCollection.insertOne(user);

        res.status(201).json({ message: "Verification email sent" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/verify", async (req, res) => {
    try {
        const { username, password, verificationCode } = req.body;

        if (!username || !password || !verificationCode) {
            return res.status(400).json({ error: "Bad Request" });
        }

        const unverifiedUser = unverifiedUsersCollection.findOne({ username });

        if (!unverifiedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const passwordHash = cryptoUtil.getPasswordHash(password);

        if (passwordHash !== unverifiedUser.passwordHash) {
            return res.status(401).json({ error: "Invalid password" });
        }

        if (verificationCode === unverifiedUser.verificationCode) {
            const user = {
                username: unverifiedUser.userName,
                passwordHash: unverifiedUser.passwordHash,
                email: unverifiedUser.email,
            }

            await usersCollection.insertOne(user);

            await unverifiedUsersCollection.deleteOne({ username });

            res.status(200).json({ message: "User verified successfully" });
        }
        else {
            res.status(401).json({ error: "Invalid verification code" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Bad Request" });
        }

        const unverifiedUser = await unverifiedUsersCollection.findOne({ username });

        if (unverifiedUser) {
            const passwordHash = cryptoUtil.getPasswordHash(password);
            
            if (passwordHash === unverifiedUser.passwordHash) {
                const verificationCode = cryptoUtil.generateVerificationCode();
                
                await unverifiedUsersCollection.updateOne({ username }, { $set: { verificationCode } })
                
                await sendEmailVerification(username, email, verificationCode);

                return res.status(403).json({ error: "User not verified", verify: true });
            }
            else {
                return res.status(409).json({ error: "Username already exists" });
            }
        }

        const verifiedUser = await usersCollection.findOne({ username });

        if (!verifiedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const passwordHash = cryptoUtil.getPasswordHash(password);

        if (passwordHash !== verifiedUser.passwordHash) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const token = cryptoUtil.generateRandomToken();

        await usersCollection.updateOne({ username }, { $set: { token }});

        res.status(200).json({ message: "Login successful", token });
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