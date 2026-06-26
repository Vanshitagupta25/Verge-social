import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true, default: 'user', enum: ['user', 'admin'], type: String })
  role!: string;

  @Prop()
  avatarUrl!: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Channel' }], default: [] })
  channels!: MongooseSchema.Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);