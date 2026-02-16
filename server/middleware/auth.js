import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const secretKey = process.env.SECRET_KEY || "default-secret-key";

const authenticateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    const token = authHeader?.split(" ")[1];
    const tokenPreview = token ? `${token.slice(0, 10)}...` : "n/a";
    console.log(
        `[AUTH] ${req.method} ${req.originalUrl} Authorization: ${authHeader ? "present" : "missing"} token: ${tokenPreview}`
    );

    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token." });
        }

        req.user = decoded;
        req.user.userId = decoded.userId || decoded.id;

        next();
    });
};

export default authenticateToken;
