import nodemailer from 'nodemailer';

export default class Notifier {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,  // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
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

  notify(content: string) {
    const mailOption = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: 'A new prediction is in!',
      text: content,
    };

    console.log('[DEBUG] 1');
    this.transporter.sendMail(mailOption, (err, info) => {
      if (err) {
        console.error('Error sending email: ', err);
      } else {
        console.log('Email sent ', info.response);
      }
    });

    console.log('[DEBUG] 2');
  }
}