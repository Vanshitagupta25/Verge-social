import { IsEmail, IsNotEmpty, IsString, IsOptional, Length, IsEnum } from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @IsString()
  @Length(6, 20, {
    message: 'Password must be between 6 and 20 characters',
  })
  password!: string;
}
export class LoginDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @IsString()
  @IsOptional()
  @IsEnum(['user', 'admin'], { message: 'Requested role must be user or admin' })
  role?: string;
}