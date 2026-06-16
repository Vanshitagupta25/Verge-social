import { IsString, IsNotEmpty, Length, Matches, IsOptional } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty({ message: 'Channel name is mandatory.' })
  @Length(3, 30, { message: 'Channel name must be between 3 and 30 characters.' })
  @Matches(/^[A-Za-z0-9][A-Za-z0-9 _-]*$/, {
    message: 'Channel name can only contain alphanumeric characters, hyphens, and underscores.',
  })
  name: string;

  @IsOptional()
  @IsString()
  @Length(10, 200, { message: 'Description must be between 10 and 200 characters.' })
  description?: string;
}