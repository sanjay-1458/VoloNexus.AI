import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { RedisService } from "../redis/redis.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

@Injectable()
export class SettingsService {
  constructor(
    private usersService: UsersService,
    private redisService: RedisService,
  ) {}

  async getProfile(userId: string) {
    const cachedProfile = await this.redisService.getSession(userId);
    if (cachedProfile) {
      return cachedProfile;
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException("User profile not found");
    }

    const profile = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profile_picture: user.profile_picture,
      company: user.company,
      phone: user.phone,
      preferences: user.preferences,
      automation_rules: user.automation_rules,
      plan: user.plan,
    };

    await this.redisService.setSession(userId, profile, 3600);

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateSettingsDto) {
    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.company !== undefined) updateData.company = dto.company;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.profile_picture !== undefined)
      updateData.profile_picture = dto.profile_picture;

    const user = await this.usersService.updateById(userId, updateData);

    const updatedProfile = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profile_picture: user.profile_picture,
      company: user.company,
      phone: user.phone,
    };

    await this.refreshCache(userId);

    return updatedProfile;
  }

  async updatePreferences(userId: string, preferences: any) {
    const user = await this.usersService.updatePreferences(userId, preferences);

    await this.refreshCache(userId);

    return { preferences: user.preferences };
  }

  async updateAutomationRules(userId: string, rules: any[]) {
    const user = await this.usersService.updateById(userId, {
      automation_rules: rules,
    } as any);

    await this.refreshCache(userId);

    return { automation_rules: user.automation_rules };
  }

  private async refreshCache(userId: string) {
    const user = await this.usersService.findById(userId);
    if (user) {
      const profile = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        profile_picture: user.profile_picture,
        company: user.company,
        phone: user.phone,
        preferences: user.preferences,
        automation_rules: user.automation_rules,
        plan: user.plan,
      };
      await this.redisService.setSession(userId, profile, 3600);
    }
  }
}
