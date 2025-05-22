import { NextFunction, Request, Response } from "express";
import { getUserData, IUserToken } from "../utils/jwt";

export interface IReqUser extends Request {
    user?: IUserToken;
}

export default (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers?.authorization;
    if (!authorization) {
        return next(res.status(403).json({
            message: "Unauthorized",
            data: null
        }));
    }
    const [prefix, token] = authorization.split(" ");
    if (!(prefix === "Bearer" && token)) {
        return next(res.status(403).json({
            message: "Unauthorized",
            data: null
        }));
    }
    const user = getUserData(token);
    if (!user) {
        return next(res.status(403).json({
            message: "Unauthorized",
            data: null
        }));
    }
    (req as IReqUser).user = user;
    next();
}