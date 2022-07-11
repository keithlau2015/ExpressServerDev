const nodemailer = require("nodemailer");
const { ErrorLog, SystemLog } = require("./DebugUtility");

// const sendEmail = (options) => {
//     const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth:{
//             user: "yulamkwok@gmail.com",
//             pass: "lrudcrbcxymwpjyy"
//         }
//     });

//     const mailOptions = {
//         from: "yulamkwok@gmail.com",
//         to: options.to,
//         subject: options.subject,
//         html: options.text
//     };

//     transporter.sendMail(mailOptions, (err,info) =>{
//         if (err){
//             return ErrorLog(err);
//         } 
//         return SystemLog(info);
//     });
// }
let transporter;
const sendEmail = (options) => {
    try{
        transporter = nodemailer.createTransport( {
            host: options.mailhost,
            port: options.mailport,
            secure: options.mailsecure,
            auth:{
                user: options.mailusername,
                pass: options.mailpass
            }
        });
    }catch(err){
        console.log(err);
    }
    

    const mailOptions = {
        from: "helperscloud@telebuddies.co",
        to: options.to,
        subject: options.subject,
        html: options.text
    };

    transporter.sendMail(mailOptions, (err,info) =>{
        if (err){
            return ErrorLog(err);
        } 
        return 
    });
}

module.exports = sendEmail;