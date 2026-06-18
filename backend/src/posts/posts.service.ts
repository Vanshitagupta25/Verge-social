import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
  ) { }

  async createPost(
    content: string,
    authorId: string,
    imageUrl?: string,
    channelId?: string,
  ) {
    let finalChannelId: Types.ObjectId | null = null;
    if (channelId && channelId !== 'null' && channelId !== 'undefined' && channelId.trim() !== '') {
      finalChannelId = new Types.ObjectId(channelId);
    }

    const newPost = new this.postModel({
      content,
      authorId: new Types.ObjectId(authorId),
      imageUrl: imageUrl || null,
      channelId: finalChannelId,
    });
    return newPost.save();
  }

  async getAllPosts() {
    return this.postModel.find().populate('authorId', 'name email role avatarUrl').exec();
  }

  async getPaginatedPosts(limit: number, nextCursor?: string, channelId?: string) {
    console.log('GET PAGINATED POSTS HIT');
    const query: any = {};

    if (channelId) {
      query.channelId = new Types.ObjectId(channelId);
    } else {
      query.channelId = null;
    }
    if (nextCursor) {
      query._id = { $lt: new Types.ObjectId(nextCursor) };
    }

    const posts = await this.postModel
      .find(query)
      .populate('authorId', 'name email role avatarUrl')
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();

    console.log('POST AUTHOR', JSON.stringify(posts[0]?.authorId, null, 2));

    const hasNextPage = posts.length > limit;

    if (hasNextPage) {
      posts.pop();
    }

    const nextCursorId = posts.length > 0 ? posts[posts.length - 1]._id : null;

    return {
      data: posts,
      meta: {
        nextCursor: hasNextPage ? nextCursorId : null,
        hasNextPage,
      },
    };
  }

  async getPostById(postId: string) {
    const post = await this.postModel.findById(postId).populate('authorId', 'name email role avatarUrl').exec();

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }
    return post;
  }

  async deletePost(postId: string, userId: string, userRole: string) {
    const post = await this.postModel.findById(postId);

    if (!post) {
      throw new NotFoundException('Post not Exist');
    }
    const isAuthor = post.authorId.toString() === userId;
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('Access Denied')
    }
    await this.postModel.findByIdAndDelete(postId);

    return { message: 'Post deleted successfully' }
  }
}