const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendResetEmail(toEmail, resetLink) {
  await transporter.sendMail({
    from: `"MockMate" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset Your Password',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 10 minutes.</p>`
  });
}

module.exports = { sendResetEmail };