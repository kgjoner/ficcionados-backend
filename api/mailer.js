const nodemailer = require('nodemailer');
if(!process.env.MAILER_AUTH) {
    var { mailerAuth } = require('../.env')
} else {
    var mailerAuth = process.env.MAILER_AUTH
}

module.exports = app => {

    const { existOrError } = app.api.validator

    const post = (req, res) => {

        const mailData = {...req.body}

        try {
            existOrError(mailData.name, 'Nome não informado')
            existOrError(mailData.from, 'E-mail não informado')
            existOrError(mailData.subject, 'Assunto não informado')
            existOrError(mailData.content, 'A mensagem está vazia!')
        } catch(msg) {
            res.status(400).send(msg)
        }

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'para.ficcionados@gmail.com',
                pass: process.env.MAILER_AUTH || mailerAuth
            }
        });

        var mailOptions = {
            from: `${mailData.name}<para.ficcionados@gmail.com>`,
            to: 'contato@ficcionados.com',
            subject: mailData.subject,
            text: `De: ${mailData.name} <${mailData.from}>
            Assunto: ${mailData.subject}
            
            Mensagem:
            ${mailData.content}`
        };

        transporter.sendMail(mailOptions)
            .then(() => res.status(204).send())
            .catch(e => res.status(500).send(e))
    }

    return { post }
}

