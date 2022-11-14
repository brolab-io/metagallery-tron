import { Controller, Get } from '@nestjs/common';
import { FindQuery, FindQueryResult } from '../../commons/decorator';
import { PaymentTokenService } from './payment-token.service';

@Controller('payment-tokens')
export class PaymentTokenController {
  constructor(private readonly paymentTokenService: PaymentTokenService) {}

  @Get()
  async getPaymentTokens(@FindQuery() findQuery: FindQueryResult) {
    return await this.paymentTokenService.getPaymentTokens(findQuery);
  }
}
