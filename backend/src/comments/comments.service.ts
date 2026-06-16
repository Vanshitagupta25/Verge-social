import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,

    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
  ) {}

  async createComment(content: string, postId: string, userId: string, parentId?: string) {
    const postExists = await this.postModel.findById(postId);
    if (!postExists) {
      throw new NotFoundException('No post found');
    }
    if (parentId) {
      const parentExists = await this.commentModel.findById(parentId);
      if (!parentExists) {
        throw new NotFoundException('No Parent Comment Found');
      }
    }
    const newComment = new this.commentModel({
      content: content,
      postId: new Types.ObjectId(postId),
      authorId: new Types.ObjectId(userId),
      parentId: parentId ? new Types.ObjectId(parentId) : null,
    });
    const savedComment = await newComment.save();
    await this.postModel.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 },
    });
    return savedComment;
  }

  async getPostCommentsTree(postId: string) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new BadRequestException(`Received an invalid MongoDB ObjectId string: "${postId}"`);
    }
    const allComments = await this.commentModel
      .find({ postId: new Types.ObjectId(postId) })
      .populate('authorId', 'name email role avatarUrl')
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    const commentMap: { [Key: string]: any } = {};
    const commentTree: any[] = [];

    allComments.forEach((comment) => {
      commentMap[comment._id.toString()] = { ...comment, replies: [] };
    });

    allComments.forEach((comment) => {
      const mappedComment = commentMap[comment._id.toString()];
      if (comment.parentId) {
        const parent = commentMap[comment.parentId.toString()];
        if (parent) {
          parent.replies.push(mappedComment);
        } else {
          commentTree.push(mappedComment);
        }
      } else {
        commentTree.push(mappedComment);
      }
    });
    return commentTree;
  }

  async updateComment(commentId: string, newContent: string, currentUser: any) {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Invalid Comment ID');
    }

    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId.toString() !== currentUser?.id) {
      throw new ForbiddenException('You are not authorized to edit this comment');
    }
    if (comment.editedOnce) {
     throw new ForbiddenException("You can edit only once");
    }
    comment.content = newContent;
    await comment.save();

    return {
      message: 'Comment updated successfully!',
      comment,
    };
  }

  async deleteComment(commentId: string, currentUser: any) {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('Invalid Comment ID');
    }
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    const isAuthor = comment.authorId.toString() === currentUser?.id;
    const isAdmin = currentUser?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('You are not authorized to delete this comment');
    }
    const childReplies = await this.commentModel.find({ parentId: new Types.ObjectId(commentId) });
    const replyIds = childReplies.map((reply) => reply._id);

    const commentIdStr = comment._id.toString();

    await this.commentModel.deleteMany({
      $or: [
        { _id: comment._id },
        { parentId: commentIdStr },
      ],
    });

    const totalDeleted = 1 + replyIds.length;

    await this.postModel.findByIdAndUpdate(comment.postId, {
      $inc: { commentsCount: -totalDeleted },
    });

    return {
      message: isAdmin
        ? 'Comment administratively removed along with its replies'
        : 'Comment and its replies successfully removed',
      totalDeleted,
    };
  }
}