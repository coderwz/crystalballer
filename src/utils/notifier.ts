import nodemailer from 'nodemailer';

export default class Notifier {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,  // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_FROM_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    this.transporter.verify((error) => {
      if (error) {
        console.log('Nodemailer transporter is not working properly: ', error);
      } else {
        console.log('Server is ready to take our messages');
      }
    });
  }

  async notify(htmlContent: string) {
    const mailOption = {
      from: process.env.EMAIL_FROM_USER,
      to: process.env.EMAIL_TO_USER,
      subject: 'A new prediction is in!',
      html: htmlContent,
    };

    await new Promise((resolve, reject) => {
      // send mail
      this.transporter.sendMail(mailOption, (err, info) => {
        if (err) {
          console.error('Error sending email: ', err);
          reject(err);
        } else {
          console.log('Email sent ', info);
          resolve(info);
        }
      });
    });
  }
}