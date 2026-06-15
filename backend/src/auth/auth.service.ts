import { ConflictException, Injectable, Options, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { SignupDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) { }

  async signUp(signupDto: SignupDto) {
    const { name, email, password } = signupDto;

    const emailExists = await this.userModel.findOne({ email });
    if (emailExists) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let assignedRole = 'user';

    if (email.endsWith('@admin.com') || email === '.admin@gmail.com') {
      assignedRole = 'admin';
    }

    const newUser = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
    });

    return {
      userId: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials!');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials!');
    }
    const assignedRole = loginDto.role || user.role;

    // Generate JWT Token
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: assignedRole,
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role ?? 'user',
        avatarUrl: user.avatarUrl || null,
      },
    };
  }
}