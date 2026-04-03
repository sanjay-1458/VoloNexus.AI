import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel({
      ...data,
      email: data.email?.toLowerCase(),
    });
    return user.save();
  }

  async updateById(id: string, data: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findAll(filter: any = {}): Promise<UserDocument[]> {
    return this.userModel.find(filter).select("-password_hash").exec();
  }

  async countUsers(filter: any = {}): Promise<number> {
    return this.userModel.countDocuments(filter).exec();
  }

  async updatePreferences(
    userId: string,
    preferences: any,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: { preferences } }, { new: true })
      .exec();

    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async incrementMeetingCount(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $inc: { total_meetings_scheduled: 1, weekly_meeting_count: 1 },
      })
      .exec();
  }

  async resetWeeklyMeetingCounts(): Promise<void> {
    await this.userModel
      .updateMany({}, { $set: { weekly_meeting_count: 0 } })
      .exec();
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User instance not found in cloud storage.`);
    }
  }

  async upgradeUserPlanByEmail(
    email: string,
    plan: string,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase() },
        { $set: { plan } },
        { new: true },
      )
      .exec();
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }
}

