import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendMail = async (options) => {
  const mailGenerator = new Mailgen({
    // Crafting an email for verification
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://mailgen.js/",
    },
  });

  var emailText = mailGenerator.generatePlaintext(options.mailGenContent);
  var emailHtml = mailGenerator.generate(options.mailGenContent);

  const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});
const mail = {
    from: `mail.taskmanager@example.com`,
    to: options.email,
    subject: options.subject,
    text: emailText, // Plain-text version of the message
    html: emailHtml, // HTML version of the message
}

try {
    await transporter.sendMail(mail)
} catch (error) {
    console.error("Email failed..")
}

};


const emailVerificationMailGenContent = (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to Task Manager! We're very excited to have you on board.",
      action: {
        instructions: "To get started with our App, please click here:",
        button: {
          color: "#22BC66", // Optional action button color
          text: "verify your account",
          link: verificationUrl,
        },
      },
    },
    outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
  };
};

const forgotPasswordMailGenContent = (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "We got a request to reset your password",
      action: {
        instructions: "To change your password, please click here:",
        button: {
          color: "#ff0f0f", // Optional action button color
          text: "reset Password",
          link: passwordResetUrl,
        },
      },
    },
    outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
  };
};

export {
  sendMail,
  emailVerificationMailGenContent,
  forgotPasswordMailGenContent
};
// sendMail({
//     email:user.email,
//     subject:"aaaa",
//     mailGenContent:emailVerificationMailGenContent(username,``)
// })


