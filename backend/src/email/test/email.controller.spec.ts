import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from '../email.controller';
import { EmailService } from '../email.service';
import { SendEmailDto } from '../dto/send-email.dto';

describe('EmailController', () => {
  let controller: EmailController;
  let emailService: EmailService;

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    controller = module.get<EmailController>(EmailController);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call emailService.sendEmail and return void', async () => {
    const dto: SendEmailDto = {
      sender: { name: 'Test', address: 'test@mail.com' },
      recipients: 'dest@mail.com',
      subject: 'Test Subject',
      html: '<b>Hello</b>',
      text: 'Hello',
    };
    mockEmailService.sendEmail.mockResolvedValueOnce(undefined);

    await expect(controller.sendEmail(dto)).resolves.toBeUndefined();
    expect(emailService.sendEmail).toHaveBeenCalledWith(dto);
  });
});