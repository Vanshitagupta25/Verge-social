import { IsNotEmpty, IsString, IsMongoId, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment Id can not be empty!' })
  content!: string;

  @IsMongoId({ message: 'postId should be a valid MongoId!' })
  @IsNotEmpty()
  postId!: string;

  @IsString()
  @IsOptional()
  @IsMongoId({
  message: 'parentId should be a valid MongoId!' })
  parentId?: string;
}