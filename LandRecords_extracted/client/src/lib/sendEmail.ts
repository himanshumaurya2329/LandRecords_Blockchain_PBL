import nodemailer from 'nodemailer';

export async function sendEmailAlert({
    to,
    subject,
    html
}: {
    to: string;
    subject: string;
    html: string;
}) {
    try {
        // If SMTP host isn't configured, we'll gracefully fallback to test console log
        if (!process.env.SMTP_HOST) {
            console.log('====================================');
            console.log(`[STUB EMAIL] To: ${to}`);
            console.log(`[STUB EMAIL] Subject: ${subject}`);
            console.log('====================================');
            return true;
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: `"E-Land System" <${process.env.SMTP_FROM || 'noreply@elandrecords.local'}>`,
            to,
            subject,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
}
