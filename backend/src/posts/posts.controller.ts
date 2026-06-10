import { Body, Controller, Post, UseGuards, Req, UploadedFile, UseInterceptors, Get, Query, Param, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { AuthGuard } from '../auth/auth.guard';
import cloudinary from 'src/config/cloudinary.config';

@Controller('posts')
@UseGuards(AuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(@Body() body: any, @UploadedFile() file: any, @Req() req: any) {
    console.log("DEBUG: Entered the create method!");
    console.log("BODY CONTENT:", body);
    console.log("FILE OBJECT:", file);

    let imageUrl = body.imageUrl;

    console.log("File received in controller", file, imageUrl);
    if (file) {
      const result = await new Promise((resolve, reject) => {
        console.log("Buffer exists:", !!file?.buffer);
        console.log("Buffer length:", file?.buffer?.length);
        cloudinary.uploader.upload_stream(
          { folder: 'posts' },
          (error, result) => {
            console.log("Cloudinary Error:", error);
            console.log("Cloudinary Result:", result);

            if (error) reject(error);
            else resolve(result);
          }
        ).end(file.buffer);
      });
      console.log("Cloudinary URL generated:", (result as any).secure_url);
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
  async getFeed(
    @Query('limit') limit: string,
    @Query('cursor') cursor?: string,
    @Query('channelId') channelId?: string,
  ) {
    const parsedLimit = parseInt(limit, 10) || 5;
    const cleanChannelId = (channelId === 'null' || channelId === 'undefined' || !channelId) ? undefined : channelId;
    return this.postsService.getPaginatedPosts(parsedLimit, cursor, cleanChannelId);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    return this.postsService.getPostById(id);
  }

  @Delete(':id')
  async deletePost(@Param('id') id: string, @Req() req: any) {
    return this.postsService.deletePost(id, req.user.sub, req.user.role);
  }
}