import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Channel, ChannelDocument } from './schemas/channel.schema';
import { CreateChannelDto } from './dtos/create-channel.dto';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    @InjectModel(Channel.name) private readonly channelModel: Model<ChannelDocument>,
  ) {}

  async create(createChannelDto: CreateChannelDto): Promise<Channel> {
    try {
      const newChannel = new this.channelModel(createChannelDto);
      console.log("new channel", newChannel);
      return await newChannel.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('A channel with this identifier already exists within the system record.');
      }
      this.logger.error(`Database layer fault during creation: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to process channel state mutation inside MongoDB.');
    }
  }

  async findAll(): Promise<Channel[]> {
    try {
      return await this.channelModel.find({ isActive: true }).sort({ name: 1 }).exec();
    } catch (error: any) {
      this.logger.error(`Failed to collect data from collection stream: ${error.message}`);
      throw new InternalServerErrorException('Data extraction runtime error.');
    }
  }

  async findOne(id: string): Promise<Channel> {
    const channel = await this.channelModel.findById(id).exec();
    if (!channel || !channel.isActive) {
      throw new NotFoundException(`Requested channel resources for identifier entity ${id} not found.`);
    }
    return channel;
  }
}