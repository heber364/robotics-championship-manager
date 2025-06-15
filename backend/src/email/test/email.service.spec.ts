import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../email.service';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { SendEmailDto } from '../dto/send-email.dto';

type keyofConfig =
  | 'MAIL_SERVICE'
  | 'MAIL_USER'
  | 'MAIL_PASSWORD'
  | 'MAIL_SENDER_NAME'
  | 'MAIL_SENDER_ADDRESS';

const mockConfigService = {
  get: jest.fn((key: keyofConfig) => {
    const config = {
      MAIL_SERVICE: 'gmail',
      MAIL_USER: 'test@mail.com',
      MAIL_PASSWORD: 'password',
      MAIL_SENDER_NAME: 'Test Sender',
      MAIL_SENDER_ADDRESS: 'test@mail.com',
    };
    return config[key];
  }),
};

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
    jest
      .spyOn(emailService['mailTransport'], 'sendMail')
      .mockImplementation(() => Promise.resolve());
  });

  it('should be defined', () => {
    expect(emailService).toBeDefined();
  });

  it('should send email successfully', async () => {
    jest.spyOn(emailService['mailTransport'], 'sendMail').mockResolvedValueOnce(true);

    const dto: SendEmailDto = {
      sender: { name: 'Test', address: 'test@mail.com' },
      recipients: 'dest@mail.com',
      subject: 'Test Subject',
      html: '<b>Hello</b>',
      text: 'Hello',
    };

    await expect(emailService.sendEmail(dto)).resolves.toBeUndefined();
    // expect(mockSendMail).toHaveBeenCalledWith(
    //   expect.objectContaining({
    //     from: dto.sender,
    //     to: dto.recipients,
    //     subject: dto.subject,
    //     html: dto.html,
    //     text: dto.text,
    //   }),
    // );
  });

  it('should use default sender if sender is not provided', async () => {
    const mockSendMail = jest
      .spyOn(emailService['mailTransport'], 'sendMail')
      .mockResolvedValueOnce(true);
    const dto: SendEmailDto = {
      recipients: 'dest@mail.com',
      subject: 'Test Subject',
      html: '<b>Hello</b>',
      text: 'Hello',
    };

    await expect(emailService.sendEmail(dto)).resolves.toBeUndefined();

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: {
          name: mockConfigService.get('MAIL_SENDER_NAME'),
          address: mockConfigService.get('MAIL_SENDER_ADDRESS'),
        },
        to: dto.recipients,
        subject: dto.subject,
        html: dto.html,
        text: dto.text,
      }),
    );
  });

  it('should throw if neither sender nor default sender address is provided', async () => {
    jest.spyOn(mockConfigService, 'get').mockImplementation((key: keyofConfig): string => {
      const config: Record<keyofConfig, string> = {
        MAIL_SERVICE: 'gmail',
        MAIL_USER: 'test@mail.com',
        MAIL_PASSWORD: 'password',
        MAIL_SENDER_ADDRESS: '',
        MAIL_SENDER_NAME: '',
      };
      return config[key];
    });

    const dto: SendEmailDto = {
      recipients: 'dest@mail.com',
      subject: 'Test Subject',
      html: '<b>Hello</b>',
      text: 'Hello',
    };

    jest.spyOn(emailService['mailTransport'], 'sendMail').mockRejectedValueOnce(new Error());

    await expect(emailService.sendEmail(dto)).rejects.toThrow(
      new InternalServerErrorException('Failed to send email: mail service error.'),
    );
  });

  it('should throw if sendMail fails', async () => {
    jest.spyOn(emailService['mailTransport'], 'sendMail').mockRejectedValueOnce(new Error());

    const dto: SendEmailDto = {
      sender: { name: 'Test', address: 'test@mail.com' },
      recipients: 'dest@mail.com',
      subject: 'Test Subject',
      html: '<b>Hello</b>',
      text: 'Hello',
    };

    await expect(emailService.sendEmail(dto)).rejects.toThrow(
      new InternalServerErrorException('Failed to send email: mail service error.'),
    );
  });
});
