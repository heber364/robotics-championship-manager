import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import { SendEmailDto } from './dto/send-email.dto';
import { Address } from 'nodemailer/lib/mailer';

@Injectable()
export class EmailService {
  private mailTransport: Transporter;

  constructor(private configService: ConfigService) {
    this.mailTransport = createTransport({
      service: this.configService.get('MAIL_SERVICE'),
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendEmail(data: SendEmailDto): Promise<void> {
    const { sender, recipients, subject, html, text } = data;

    const defaultSender: Address = {
      name: this.configService.get<string>('MAIL_SENDER_NAME') || 'No Reply',
      address: this.configService.get<string>('MAIL_SENDER_ADDRESS') || 'no-reply@localhost',
    };

    const from = sender ?? defaultSender;

    const mailOptions: SendMailOptions = {
      from,
      to: recipients,
      subject,
      html,
      text,
    };

    try {
      await this.mailTransport.sendMail(mailOptions);
    } catch (err) {
      console.error('Error sending email:', err);
      throw new InternalServerErrorException('Failed to send email: mail service error.');
    }
  }
}
