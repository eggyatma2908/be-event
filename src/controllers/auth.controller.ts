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
    password: Yup.string().required(),
    confirmPassword: Yup.string().required().oneOf([Yup.ref("password"), ""], "Password not match")
});

export default {
    async register(req: Request, res: Response, next: NextFunction) {
        const { fullName, username, email, password, confirmPassword } = req.body as unknown as Tregsiter;
        try {
            await registerValidateSchema.validate({
                fullName,
                username,
                email,
                password,
                confirmPassword
            });
            // Cek apakah username sudah ada
            const existingUser = await UserModel.findOne({ username });
            if (existingUser) {
                return next(res.status(400).json({ message: "Username already exist!" }));
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
                ],
            });
            // Cek apakah identifier ada
            if (!userByIdentifier) {
                return next(res.status(403).json({
                    message: "User not found",
                    data: null
                }));
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
    }
}