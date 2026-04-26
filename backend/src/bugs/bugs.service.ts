import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { BugReport, BugReportDocument } from "./schemas/bug.schema";
import { AiService } from "../ai/ai.service";

@Injectable()
export class BugsService {
  private readonly logger = new Logger(BugsService.name);

  constructor(
    @InjectModel(BugReport.name) private bugModel: Model<BugReportDocument>,
    private aiService: AiService,
  ) {}

  async create(userId: string | null, data: any): Promise<any> {
   
    if (!data || !data.description || data.description.trim() === "") {
      throw new BadRequestException("Bug description is required.");
    }

    let aiRelevant = true;
    let aiSummary = "No summary generated";
    let aiImpact = "Pending admin review";
    let aiFiltered = false;

    try {
      const aiAnalysis = await this.aiService.analyzeBugReport(
        data.description,
        data.severity,
      );

      aiRelevant = aiAnalysis.is_relevant ?? true;
      aiSummary = aiAnalysis.summary || data.description.substring(0, 50);
      aiImpact = aiAnalysis.impact_analysis || "Pending admin review";
      aiFiltered = true;
    } catch (error: any) {
      this.logger.error("AI Bug Filter failed", error.message);
    }

    try {
      let validUserId: Types.ObjectId | null = null;
      if (userId && Types.ObjectId.isValid(userId)) {
        validUserId = new Types.ObjectId(userId);
      }

      const bug = new this.bugModel({
        user_id: validUserId, 
        description: data.description,
        screenshots: data.screenshots || [],
        severity: data.severity || "medium",
        page_url: data.page_url,
        browser_info: data.browser_info,
        ai_filtered: aiFiltered,
        ai_relevant: aiRelevant,
        ai_summary: aiSummary,
        ai_impact_analysis: aiImpact,
      });

      const saved = await bug.save();
      return this.serialize(saved);
    } catch (dbError: any) {
      this.logger.error("Failed to save bug report to database", dbError.stack);
      throw new InternalServerErrorException(
        `Database failed to save bug report: ${dbError.message}`,
      );
    }
  }

  async findAll(filters: { status?: string; severity?: string } = {}) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;

    const bugs = await this.bugModel.find(query).sort({ createdAt: -1 }).exec();

    return bugs.map((b) => this.serialize(b));
  }

  async updateStatus(bugId: string, status: string, adminNotes?: string) {
    const update: any = { status };
    if (adminNotes) update.admin_notes = adminNotes;
    if (status === "resolved") update.resolved_at = new Date();

    const bug = await this.bugModel.findByIdAndUpdate(
      bugId,
      { $set: update },
      { new: true },
    );

    if (!bug) throw new NotFoundException("Bug report not found");
    return this.serialize(bug);
  }

  async delete(bugId: string) {
    const bug = await this.bugModel.findByIdAndDelete(bugId);
    if (!bug) throw new NotFoundException("Bug report not found");
    return { message: "Bug successfully deleted" };
  }

  async getStats() {
    const [total, bySeverity, byStatus] = await Promise.all([
      this.bugModel.countDocuments(),
      this.bugModel.aggregate([
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
      this.bugModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    return { total, by_severity: bySeverity, by_status: byStatus };
  }

  private serialize(bug: BugReportDocument) {
    const obj = bug.toObject();
    return {
      id: obj._id.toString(),
      user_id: obj.user_id?.toString() || null,
      description: obj.description,
      screenshots: obj.screenshots,
      severity: obj.severity,
      status: obj.status,
      ai_filtered: obj.ai_filtered,
      ai_relevant: obj.ai_relevant,
      ai_summary: obj.ai_summary,
      ai_impact_analysis: obj.ai_impact_analysis,
      page_url: obj.page_url,
      admin_notes: obj.admin_notes,
      created_at: obj.createdAt,
    };
  }
}
