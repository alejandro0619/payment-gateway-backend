/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Equal } from 'typeorm';
import { SupabaseService } from '../supabase/supabase.service';
import { User } from '../user/entities/user.entity';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { userRoles } from '../common/constants';
@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UserService,
  ) {}

  /**
   * Sign up a new user with email and password
   */
  async signUp(user: CreateUserDto) {
    const email = user.email;
    const password = user.password;
    const idExists = await this.usersService.findOne({
      where: { identificationNumber: Equal(user.identificationNumber) },
    });
    const emailExists = await this.usersService.findOne({
      where: { email: Equal(user.email) },
    });
    if (user.role !== 'user') {
      throw new UnauthorizedException('Not allowed');
    }
    if (idExists || emailExists) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signUp({ email, password });

    if (error) {
      throw new Error(error.message);
    }

    const { password: userPassword, ...userToSave } = user;
    await this.usersService.create(userToSave);

    return {
      user: userToSave,
      accessToken: data?.session?.access_token,
    };
  }

  /**
   * TODO: SAME BEHAVIOR AS signIn METHOD
   */
  async signUpAdmin(user: CreateUserDto) {
    const email = user.email;
    const password = user.password;
    const idExists = await this.usersService.findOne({
      where: { identificationNumber: Equal(user.identificationNumber) },
    });
    const emailExists = await this.usersService.findOne({
      where: { email: Equal(user.email) },
    });

    this.supabaseService;
    if (idExists || emailExists) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signUp({ email, password });

    if (error) {
      throw new Error(error.message);
    }

    const { password: userPassword, ...userToSave } = user;
    await this.usersService.create({
      ...userToSave,
      role: userRoles.ADMIN,
    });

    return {
      user: {
        ...userToSave,
        role: user.role.toLocaleLowerCase(),
      },
      accessToken: data?.session?.access_token,
    };
  }

  /**
   * Sign in a user with email and password
   * TODO: CHECK THIS BEHAVIOR: WHEN A USER IS SIGNIN IN, IT FIRST SIGNS THE USER CORRECTLY THEN THROWS AN ERROR
   */
  async signIn(identification: string, password: string) {
    console.log(identification, password);
    const user =
      await this.usersService.findOneByIdentification(identification);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signInWithPassword({ email: user.email, password });

    if (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // // Save session to database
    // const session = new Session();
    // session.userId = data.user.id;
    // session.accessToken = data.session.access_token;
    // session.refreshToken = data.session.refresh_token;
    // await this.sessionRepository.save(session);

    return {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        email: user.email,
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  /**
   * Refresh a user's session using the refresh token
   * TODO: CHECK THIS BEHAVIOR
   */
  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.refreshSession({ refresh_token: refreshToken });

    if (error) {
      throw new Error(error.message);
    }

    // // Update session in database
    // const session = await this.sessionRepository.findOne({
    //   where: { refreshToken },
    // });
    // if (session) {
    //   session.accessToken = data.session?.access_token;
    //   session.refreshToken = data.session?.refresh_token;
    //   await this.sessionRepository.save(session);
    // }

    return data;
  }

  /**
   * Log out a user by invalidating their session
   */
  async logout(accessToken: string) {
    const { error } = await this.supabaseService.getClient().auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    // // Delete session from database
    // await this.sessionRepository.delete({ accessToken });

    return { message: 'Logged out successfully' };
  }

  /**
   * Validate a user's access token
   */
  async validateUser(accessToken: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.getUser(accessToken);

    const userDb = data.user?.email
      ? await this.usersService.findOne({
          where: { email: Equal(data.user.email) },
        })
      : null;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: data.user,
      user: userDb,
    };
  }

  /**
   * Check if this is the first run of the application by retrieving a count of users in the database:  If there are no users, then it is the first run
   */
  async checkFirstRun() {
    const numberOfUsers =  (await this.usersService.findAll()).length;

    
    // Negate the boolean value of numberOfUsers to return true if there are no users in the database and false if there are users.

    return !Boolean(numberOfUsers)
  }

}
