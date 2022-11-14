import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CollectionModule } from './collections/collection.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { NFTModule } from './nfts/nft.module';
import { PaymentTokenModule } from './payment-token/payment-token.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local'],
    }),
    MongooseModule.forRoot(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }),
    CollectionModule,
    NFTModule,
    PaymentTokenModule,
    MarketplaceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
