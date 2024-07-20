const crypto = require("crypto");

class CryptoUtil {
    getPasswordHash(password) {
        const hash = crypto.createHash("sha256");
        hash.update(password);
        return hash.digest("hex");
    }

    generateRandomToken() {
        return crypto.randomBytes(32).toString("hex");
    }

    generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}

module.exports = CryptoUtil;