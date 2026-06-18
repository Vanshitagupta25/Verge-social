import { Controller, Delete, Post, Body, Get, Req, Param, UseGuards, BadRequestException, Put } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { AuthGuard } from 'src/auth/auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(AuthGuard)
  @Post()
  async addComment(
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;

    return this.commentsService.createComment(
      dto.content,
      dto.postId,
      userId,
      dto.parentId,
    );
  }

  @Get('post/:postId')
  async getCommentsByPost(@Param('postId') postId: string) {
    if (!postId) {
      throw new BadRequestException('Post ID param is missing');
    }
    return this.commentsService.getPostCommentsTree(postId);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateComment(
    @Param('id') id: string,
    @Body('content') content: string,
    @Req() req: any,
  ) {
    const userPayload = {
      id: req.user.sub,
      role: req.user.role,
    };

    return this.commentsService.updateComment(id, content, userPayload);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async removeComment(@Param('id') id: string, @Req() req: any) {
    const userPayload = {
      id: req.user.sub,
      role: req.user.role,
    };
    return this.commentsService.deleteComment(id, userPayload);
  }
}