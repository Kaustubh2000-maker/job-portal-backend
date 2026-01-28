const nodemailer = require("nodemailer");

module.exports = class Email {
  constructor({ email, name }) {
    this.to = email;
    this.name = name;
    this.from = `Job Portal <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendPasswordReset(resetLink) {
    const message = `
Hello ${this.name},

You requested a password reset.

Reset Link:
${resetLink}

This link is valid for 10 minutes.

Job Portal Team
    `;

    await this.newTransport().sendMail({
      from: this.from,
      to: this.to,
      subject: "Password Reset Request",
      text: message,
    });
  }

  async sendInterviewMail({ jobTitle, scheduledAt, meetingLink }) {
    const message = `
Hello ${this.name},

Your interview for "${jobTitle}" has been scheduled.

Date & Time: ${new Date(scheduledAt).toLocaleString()}
Meeting Link: ${meetingLink}

Please join on time.

Best of luck,
Job Portal Team
    `;

    await this.newTransport().sendMail({
      from: this.from,
      to: this.to,
      subject: "Interview Scheduled",
      text: message,
    });
  }
};
