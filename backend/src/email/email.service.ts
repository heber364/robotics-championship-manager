import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, SendMailOptions, Transporter } from 'nodemailer';
import { SendEmailDto } from './dto/send-email.dto';

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

    const mailOptions: SendMailOptions = {
      from: sender ?? {
        name: this.configService.get('MAIL_SENDER_NAME') ?? '',
        address: this.configService.get('MAIL_SENDER_ADDRESS') ?? '',
      },
      to: recipients,
      subject,
      html, 
      text, 
    };

    try {
      await this.mailTransport.sendMail(mailOptions);
    } catch (error) {
      throw new InternalServerErrorException('Failed to send email: mail service error.');
    }
  }
}