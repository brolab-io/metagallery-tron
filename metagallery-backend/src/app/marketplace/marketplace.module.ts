import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NFT, NFTSchema } from '../nfts/nft.schema';
import { MarketplaceController } from './market.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: NFT.name, schema: NFTSchema }])],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
})
export class MarketplaceModule {}
