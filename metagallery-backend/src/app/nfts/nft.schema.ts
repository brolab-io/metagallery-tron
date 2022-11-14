import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { Collection } from '../collections/collection.schema';
import { PaymentToken } from '../payment-token/payment-token.schema';

@Schema({ timestamps: true })
export class NFT {
  @Prop({ required: true })
  tokenId: string;

  @Prop({ required: true })
  tokenName: string;

  @Prop({ required: true })
  tokenURI: string;

  @Prop({ required: true, lowercase: true })
  owner: string;

  @Prop()
  tokenPower: string;

  @Prop({ required: true, lowercase: true })
  creator: string;

  @Prop({ required: true, lowercase: true })
  contract: string;

  @Prop({ required: true })
  collectionId: string;

  @Prop({ required: false })
  marketId: string;

  @Prop({ required: false })
  marketPrice: string;

  @Prop({ required: false, lowercase: true })
  marketPaymentToken: string;
}

export type NFTDocument = NFT & Document;

export const NFTSchema = SchemaFactory.createForClass(NFT);

NFTSchema.plugin(mongoosePaginate);

NFTSchema.virtual('collectionInfo', {
  ref: Collection.name,
  localField: 'collectionId',
  foreignField: 'collectionId',
  justOne: true,
});

NFTSchema.virtual('paymentToken', {
  ref: PaymentToken.name,
  localField: 'marketPaymentToken',
  foreignField: 'tokenAddress',
  justOne: true,
});

NFTSchema.set('toObject', { virtuals: true });
NFTSchema.set('toJSON', { virtuals: true });
