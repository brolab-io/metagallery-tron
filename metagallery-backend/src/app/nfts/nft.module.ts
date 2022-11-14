import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NftController } from './nft.controller';
import { NFT, NFTSchema } from './nft.schema';
import { NFTService } from './nft.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: NFT.name, schema: NFTSchema }])],
  controllers: [NftController],
  providers: [NFTService],
})
export class NFTModule {}
