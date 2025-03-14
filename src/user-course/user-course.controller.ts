import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { UserCourseService } from "./user-course.service";
import { CreateUserCourseDto } from "./dto/create-user-course.dto";
import { UpdateUserCourseDto } from "./dto/update-user-course.dto";
import { AuthGuard } from "../auth/auth.guard";

@Controller("user-course")
export class UserCourseController {
  constructor(private readonly userCourseService: UserCourseService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createUserCourseDto: CreateUserCourseDto) {
    return this.userCourseService.create(createUserCourseDto);
  }

  @Post("decode")
  decodeGatewayToken(@Body() token: { token: string }) {
    console.log("token", token);
    return this.userCourseService.decodeGatewayToken(token.token);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll() {
    return this.userCourseService.findAll();
  }

  @Get(":id")
  @UseGuards(AuthGuard)
  findOne(@Param("id") id: string) {
    return this.userCourseService.findOne(+id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(
    @Param("id") id: string,
    @Body() updateUserCourseDto: UpdateUserCourseDto,
  ) {
    return this.userCourseService.update(+id, updateUserCourseDto);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  remove(@Param("id") id: string) {
    return this.userCourseService.remove(+id);
  }
}
