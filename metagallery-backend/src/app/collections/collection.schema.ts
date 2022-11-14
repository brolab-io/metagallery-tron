import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

@Schema({ timestamps: true })
export class Collection {
  @Prop({ required: true, unique: true })
  collectionId: string;

  @Prop({ required: true })
  collectionName: string;

  @Prop({ required: true })
  collectionURIs: string;

  @Prop({ required: true })
  collectionThemeId: string;

  @Prop({ required: true })
  owner: string;

  @Prop({ required: true, lowercase: true })
  contract: string;
}

export type CollectionDocument = Collection & Document;

export const CollectionSchema = SchemaFactory.createForClass(Collection);

CollectionSchema.plugin(mongoosePaginate);
