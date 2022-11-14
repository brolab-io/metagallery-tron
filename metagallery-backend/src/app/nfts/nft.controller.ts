import { Controller, Get, Param } from '@nestjs/common';
import { FindQuery, FindQueryResult } from '../../commons/decorator';
import { NFTService } from './nft.service';

@Controller('nfts')
export class NftController {
  constructor(private readonly nftService: NFTService) {}

  @Get()
  async getNFTs(@FindQuery() findQuery: FindQueryResult) {
    return await this.nftService.getNFTs(findQuery);
  }

  @Get('/:tokenId')
  async getNFT(@Param('tokenId') tokenId: string) {
    return await this.nftService.getNFT(tokenId);
  }

  @Get('/:field/:value')
  getNftByField(@Param('field') field: string, @Param('value') value: string) {
    return this.nftService.getNftByField(field, value);
  }
}
