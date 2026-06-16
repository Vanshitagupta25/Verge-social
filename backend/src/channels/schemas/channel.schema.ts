import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChannelDocument = Channel & Document;

@Schema({ timestamps: true })
export class Channel {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  name: string;

  @Prop({ required: true, trim: true })
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);