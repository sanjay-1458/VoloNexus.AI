import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountsController } from "./accounts.controller";
import { AccountsService } from "./accounts.service";
import {
  Account,
  AccountDocument,
  AccountSchema,
} from "./schemas/account.schema";
import { UsersModule } from "../users/users.module";
import { EventsModule } from "../events/events.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
    UsersModule,
    forwardRef(() => EventsModule),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
