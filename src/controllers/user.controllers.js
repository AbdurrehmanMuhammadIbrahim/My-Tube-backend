import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        console.log("Error generating access and refresh token: ", error);
        // return res.status(500).json({status: "error", message: "Something went wrong while generating referesh and access token"})
        // throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const register = async (req, res) => {

    // get user details from frontend
    const { fullName, email, username, password } = req.body

    // validation - not empty
    if ([username, email, fullName, password].some((field) => field?.trim() === "")) {
        return res.status(400).json({ status: "error", message: "All fields are required" })
    }
    // check if user already exists: username, email
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existingUser) {
        return res.status(409).json({ status: "error", message: "User already exists" })
    }
    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;


    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if (!avatarLocalPath) {
        return res.status(400).json({ status: "error", message: "Avatar is required" })
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        return res.status(500).json({ status: "error", message: "Error uploading avatar" })
    }

    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // check for user creation

    if (!createdUser) {
        return res.status(500).json({ status: "error", message: "Error creating user" })
    }
    // return res

    return res.status(201).json(
        { status: "success", message: "User created succesfully", data: createdUser }
    )

}

const login = async (req, res) => {
    // req body -> data
    const { email, username, password } = req.body

    // username or email
    if (!(username || email)) {
        return res.status(400).json({ status: "error", message: "username or email is required" })
    }

    //find the user
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {

        return res.status(404).json({ status: "error", message: "User does not exist" })

    }
    //password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        return res.status(401).json({ status: "error", message: "Invalid user credentials" })

    }


    //access and referesh token
    try {

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        const loggedInUser = await User.findById(user._id).select(-password - refreshToken)

        const options = {
            httpOnly: true,
            secure: true
        }
        return res

            //send cookie
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                status: "success",
                message: "User logged in successfully",
                data: loggedInUser, accessToken, refreshToken
            })
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Something went wrong while generating referesh and access token" })

    }
}


const logout = async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        { new: true })


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
}


export { register, login, logout }