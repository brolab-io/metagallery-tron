import { Controller, Get, Param } from '@nestjs/common';
import { FindQuery, FindQueryResult } from '../../commons/decorator';
import { MarketplaceService } from './marketplace.service';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  async getNFTs(@FindQuery() findQuery: FindQueryResult) {
    return await this.marketplaceService.getMarketplaceItems(findQuery);
  }

  @Get('/:marketId')
  async getNFT(@Param('marketId') marketId: string) {
    return await this.marketplaceService.getMarketplaceItem(marketId);
  }

  @Get('/:field/:value')
  async getMarketItem(
    @Param('field') field: string,
    @Param('value') value: string,
  ) {
    return await this.marketplaceService.getMarketItem(field, value);
  }
}
