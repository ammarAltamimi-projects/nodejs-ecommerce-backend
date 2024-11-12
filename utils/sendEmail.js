const nodemailer = require("nodemailer")

// Sends an email using Nodemailer with the provided options.
exports.sendEmail = async (options)=> {

    const transporter = nodemailer.createTransport({
        host : process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth:{
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASSWORD
          }
    })


         await transporter.sendMail({
        from:`E-shop App <a16@bmsit.in>`,
        to:options.email,
        subject:options.subject,
        html:options.message,
    })

}


