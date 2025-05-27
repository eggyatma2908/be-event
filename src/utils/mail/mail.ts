import nodemailer from "nodemailer";
import { EMAIL_SMTP_SECURE, EMAIL_SMTP_SERVICE_NAME, EMAIL_SMTP_USER, EMAIL_SMTP_PASS, EMAIL_SMTP_PORT, EMAIL_SMTP_HOST } from "../env";
import ejs from "ejs"
import path from "path";

const transporter = nodemailer.createTransport({
    secure: EMAIL_SMTP_SECURE,
    service: EMAIL_SMTP_SERVICE_NAME,
    auth: {
        user: EMAIL_SMTP_USER,
        pass: EMAIL_SMTP_PASS
    },
    port: EMAIL_SMTP_PORT,
    host: EMAIL_SMTP_HOST,
    requireTLS: true
})

export interface ISendMail {
    from: string
    to: string,
    subject: string,
    html: string
}

export const sendMail = async({ ...mailParams }: ISendMail) => {
    const result = await transporter.sendMail({
        ...mailParams
    });
    return result;
}

export const renderMailHtml = async (template: string, data: any): Promise<string> => {
    const content = await ejs.renderFile(path.join(__dirname, `templates/${template}`), data);
    return content as string;
}