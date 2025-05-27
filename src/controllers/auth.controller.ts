import { NextFunction, Request, Response } from "express";
import * as Yup from "yup";
import UserModel from "../models/user.model";
import { encrypt } from "../utils/encryption";
import { generateToken } from "../utils/jwt";
import { IReqUser } from "../middlewares/auth.middleware";

type Tregsiter = {
    fullName: string,
    username: string,
    email: string
    password: string,
    confirmPassword: string
}

type Tlogin = {
    identifier: string,
    password: string
}

const registerValidateSchema = Yup.object({
    fullName: Yup.string().required(),
    username: Yup.string().required(),
    email: Yup.string().email().required(),
    password: Yup.string().required().min(6, "Password must be at least 6 characters").test("at-least-one-uppercase-letter", "Containts least one uppercase letter", (value) => {
        if (!value) return false;
        const regex = /^(?=.*[A-Z])/;
        return regex.test(value);
    }).test("at-least-one-number", "Containts least one number", (value) => {
        if (!value) return false;
        const regex = /^(?=.*\d)/;
        return regex.test(value);
    }),
    confirmPassword: Yup.string().required().oneOf([Yup.ref("password"), ""], "Password not match")
});

export default {
    async register(req: Request, res: Response, next: NextFunction) {
        /**
            #swagger.tags = ['Auth']
            #swagger.requestBody = {
                required: true,
                schema: { $ref: "#/components/schemas/registerRequest" }
            }
        */
        const { fullName, username, email, password, confirmPassword } = req.body as unknown as Tregsiter;
        try {
            await registerValidateSchema.validate({
                fullName,
                username,
                email,
                password,
                confirmPassword
            });
            // Cek apakah username atau email sudah digunakan
            const existingUsername = await UserModel.findOne({ username });
            if (existingUsername) {
                return next(res.status(400).json({ message: "Username already exist!" }));
            }
            const existingEmail = await UserModel.findOne({ email });
            if (existingEmail) {
                return next(res.status(400).json({ message: "Email already exist!" }));
            }
            const result = await UserModel.create({
                fullName,
                username,
                email,
                password
            })
            res.status(200).json({
                message: "Registration Success",
                data: result
            });
        } catch (error) {
            const err = error as unknown as Error;
            res.status(400).json({
                message: err.message,
                data: null
            });
        }
    },
    async login(req: Request, res: Response, next: NextFunction) {
        /**
            #swagger.tags = ['Auth']
            #swagger.requestBody = {
                required: true,
                schema: { $ref: "#/components/schemas/loginRequest" }
            }
        */
        const { identifier, password } = req.body as unknown as Tlogin;
        try {
            // Ambil data user berdasarkan identifier => email dan username
            const userByIdentifier = await UserModel.findOne({
                $or: [
                    {
                        email: identifier
                    },
                    {
                        username: identifier
                    }
                ]
            });
            // Cek apakah identifier ada
            if (!userByIdentifier) {
                return next(res.status(403).json({
                    message: "User not found",
                    data: null
                }));
            } else {
                // Cek apakah akun sudah di aktifkan
                if (!userByIdentifier.isActive) {
                    return next(res.status(403).json({
                        message: "The account has not been activated",
                        data: null
                    }));
                }
            }
            // Validasi Password
            const validatePassword: boolean = encrypt(password) === userByIdentifier.password;
            if (!validatePassword) {
                return next(res.status(403).json({
                    message: "Wrong Password",
                    data: null
                }));
            }
            const token = generateToken({
                id: userByIdentifier._id,
                role: userByIdentifier.role
            });
            res.status(200).json({
                message: "Login Success",
                data: token
            });
        } catch (error) {
            const err = error as unknown as Error;
            res.status(400).json({
                message: err.message,
                data: null
            });
        }
    },
    async user(req: IReqUser, res: Response) {
        /**
            #swagger.tags = ['Auth']
            #swagger.security = [{
                "bearerAuth": []
            }]
        */
        try {
            const user = req.user;
            const result = await UserModel.findById(user?.id);
            res.status(200).json({
                message: "Success get data user",
                data: result
            })
        } catch (error) {
            const err = error as unknown as Error;
            res.status(400).json({
                message: err.message,
                data: null
            });
        }
    },
    async activation(req: Request, res: Response) {
        /**
            #swagger.tags = ['Auth']
            #swagger.requestBody = {
                required: true,
                schema: { $ref: "#/components/schemas/activationRequest" }
            }
         */
        try {
            const { code } = req.body as { code:string };
            const user = await UserModel.findOneAndUpdate(
                {
                    activationCode: code,
                },
                {
                    isActive: true
                },
                {
                    new: true
                }
            );
            res.status(200).json({
                message: "User Successfully activated",
                user: user
            })
        } catch (error) {
            const err = error as unknown as Error;
            res.status(400).json({
                message: err.message,
                data: null
            });
        }
    }
}