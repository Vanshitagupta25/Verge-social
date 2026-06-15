import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async updateProfileFields(userId: string, payload: any) {
    delete payload.role;
    delete payload.email;

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: payload },
        { returnDocument: 'after' }
      )
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      user: updatedUser,
    };
  }
}