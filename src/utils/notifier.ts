import nodemailer from 'nodemailer';

export default class Notifier {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,  // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }

  notify(content: string, onSuccess?: () => void) {
    const mailOption = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: 'A new prediction is in!',
      text: content,
    };

    this.transporter.sendMail(mailOption, (err, info) => {
      if (err) {
        console.error('Error sending email: ', err);
      } else {
        console.log('Email sent ', info.response);

        if (onSuccess) {
          onSuccess();
        }
      }
    });
  }
}