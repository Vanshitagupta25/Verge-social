import { Controller, Patch, Body, UseInterceptors, UploadedFile, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
          folder: 'avatars',
          format: async (req: any, file: any) => 'jpg',
          public_id: (req: any, file: any) => `avatar-${Date.now()}`,
        } as any,
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(new BadRequestException('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async updateProfile(
    @Req() req: any,
    @Body('name') name: string,
    @UploadedFile() file: any,
  ) {
    const user = req.user;
    if (!user) {
      throw new BadRequestException('User authentication context missing.');
    }
    const currentUserId = user.id || user._id || user.sub;

    const payload: any = {};
    if (name && name.trim()) payload.name = name.trim();
    
    if (file) payload.avatarUrl = file.path; 

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('No changes provided to update.');
    }

    return this.usersService.updateProfileFields(currentUserId, payload);
  }
}