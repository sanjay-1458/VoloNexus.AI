import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { EventsService } from "./events.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@ApiTags("Events")
@Controller("events")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new event" })
  async create(
    @CurrentUser("_id") userId: string,
    @Body() dto: CreateEventDto,
  ) {
    const id = userId?.toString();
    return this.eventsService.create(id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List events with filters" })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "priority", required: false })
  @ApiQuery({ name: "start_date", required: false })
  @ApiQuery({ name: "end_date", required: false })
  @ApiQuery({ name: "sort_by", required: false })
  @ApiQuery({ name: "sort_order", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  async findAll(
    @CurrentUser("_id") userId: string,
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("start_date") start_date?: string,
    @Query("end_date") end_date?: string,
    @Query("sort_by") sort_by?: string,
    @Query("sort_order") sort_order?: "asc" | "desc",
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.eventsService.findByUser(userId?.toString(), {
      type,
      status,
      priority,
      start_date,
      end_date,
      sort_by,
      sort_order,
      page,
      limit,
    });
  }

  @Delete("bulk")
  @ApiOperation({ summary: "Bulk delete multiple events" })
  async bulkDelete(
    @CurrentUser("_id") userId: string,
    @Body("ids") ids: string[],
  ) {
    return this.eventsService.bulkDelete(userId?.toString(), ids);
  }

  @Delete("pattern")
  @ApiOperation({ summary: "Delete events matching title and time pattern" })
  async deletePattern(
    @CurrentUser("_id") userId: string,
    @Body() body: { title: string; start_time: string },
  ) {
    return this.eventsService.deleteByPattern(
      userId?.toString(),
      body.title,
      body.start_time,
    );
  }

  @Get("upcoming")
  @ApiOperation({ summary: "Get upcoming events" })
  async upcoming(
    @CurrentUser("_id") userId: string,
    @Query("limit") limit?: number,
  ) {
    return this.eventsService.getUpcoming(userId?.toString(), limit || 5);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get event statistics for dashboard" })
  async stats(@CurrentUser("_id") userId: string) {
    return this.eventsService.getStats(userId?.toString());
  }

  @Get("free-slots")
  @ApiOperation({ summary: "Find free time slots for a given date" })
  @ApiQuery({ name: "date", required: true, description: "YYYY-MM-DD" })
  @ApiQuery({
    name: "duration",
    required: false,
    description: "Duration in minutes (default 30)",
  })
  async freeSlots(
    @CurrentUser("_id") userId: string,
    @Query("date") date: string,
    @Query("duration") duration?: number,
  ) {
    return this.eventsService.findFreeSlots(
      userId?.toString(),
      date,
      duration || 30,
    );
  }

  @Post("simulate")
  @ApiOperation({ summary: "Simulate adding an event (shadow calendar)" })
  async simulate(
    @CurrentUser("_id") userId: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.simulate(userId?.toString(), dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single event" })
  async findOne(@CurrentUser("_id") userId: string, @Param("id") id: string) {
    return this.eventsService.findById(id, userId?.toString());
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an event" })
  async update(
    @CurrentUser("_id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, userId?.toString(), dto);
  }

  @Patch(":id/cancel")
  @ApiOperation({ summary: "Cancel an event" })
  async cancel(@CurrentUser("_id") userId: string, @Param("id") id: string) {
    return this.eventsService.cancel(id, userId?.toString());
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an event" })
  async remove(@CurrentUser("_id") userId: string, @Param("id") id: string) {
    return this.eventsService.delete(id, userId?.toString());
  }
}
