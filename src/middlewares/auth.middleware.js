import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = async (req, res, next) => {

    try {
        const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "")
        if (!token) return res.status(401).json({ status: "error", message: "Unauthorized access" })

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
        if (!user) return res.status(401).json({ status: "error", message: "Unauthorized access" })

        req.user = user
        next()




    } catch (error) {
        return res.status(401).json({ status: "error", message: "Unauthorized access" })

    }

}