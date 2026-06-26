import { Body, Controller, Post, UseGuards, Req, UploadedFile, UseInterceptors, Get, Query, Param, Delete, Patch } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { AuthGuard } from '../auth/auth.guard';
import cloudinary from 'src/config/cloudinary.config';
import { UpdatePostDto } from './dtos/post-dto';

@Controller('posts')
@UseGuards(AuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(@Body() body: any, @UploadedFile() file: any, @Req() req: any) {

    let imageUrl = body.imageUrl;

    if (file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'posts' },
          (error, result) => {

            if (error) reject(error);
            else resolve(result);
          }
        ).end(file.buffer);
      });
      imageUrl = (result as any).secure_url;
    }
    return this.postsService.createPost(
      body.content,
      req.user.sub,
      imageUrl,
      body.channelId
    );
  }
  @Get()
  async getPosts(
    @Query('limit') limit: string,
    @Query('cursor') cursor: string,
    @Query('channelId') channelId: string,
    @Req() req: any,
  ) {
    const parsedLimit = parseInt(limit, 10) || 5;
    const userId = req.user.id;

    return this.postsService.getPaginatedPosts(
      parsedLimit,
      userId,
      cursor,
      channelId,
    );
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return this.postsService.getPostById(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Body('removeImage') removeImage: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    let imageUrl: string | null | undefined = updatePostDto.imageUrl;

    if (removeImage === 'true') {
      imageUrl = null;
    }

    if (file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'posts' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        ).end(file.buffer);
      });

      imageUrl = (result as any).secure_url;
    }

    return this.postsService.updatePost(
      id,
      {
        content: updatePostDto.content,
        imageUrl,
      },
      req.user.sub,
      req.user.role,
    );
  }

  @Delete(':id')
  async deletePost(
    @Param('id') id: string,
    @Req() req: any) {
    return this.postsService.deletePost(id, req.user.sub, req.user.role);
  }
}