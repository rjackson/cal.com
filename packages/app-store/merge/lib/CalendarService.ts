import { Configuration, ATS } from "@mergeapi/merge-sdk-typescript";
import z from "zod";

import { symmetricDecrypt } from "@calcom/lib/crypto";
import logger from "@calcom/lib/logger";
import type {
  Calendar,
  CalendarEvent,
  EventBusyDate,
  IntegrationCalendar,
  NewCalendarEventType,
} from "@calcom/types/Calendar";
import type { CredentialPayload } from "@calcom/types/Credential";

import appConfig from "../config.json";
import { appKeysSchema } from "../zod";

const apiKeySchema = z.object({
  encrypted: z.string(),
});

const CALENDSO_ENCRYPTION_KEY = process.env.CALENDSO_ENCRYPTION_KEY || "";

export default class MergeCalendarService implements Calendar {
  protected integrationName = "";
  protected activiesApi: ATS.ActivitiesApi;
  protected candidatesApi: ATS.CandidatesApi;
  protected log: typeof logger;

  constructor(credential: CredentialPayload) {
    this.integrationName = appConfig.type;
    this.log = logger.getChildLogger({ prefix: [`[[lib] ${this.integrationName}`] });

    const parsedCredentialKey = apiKeySchema.safeParse(credential.key);

    if (!parsedCredentialKey.success) {
      throw Error(
        `No api credentials found for userId ${credential.userId} and appId ${credential.appId}: ${parsedCredentialKey.error}`
      );
    }

    const decrypted = symmetricDecrypt(parsedCredentialKey.data.encrypted, CALENDSO_ENCRYPTION_KEY);
    const { apiKey, accountToken } = appKeysSchema.parse(JSON.parse(decrypted));

    const configuration = new Configuration({ apiKey, accessToken: accountToken });
    this.activiesApi = new ATS.ActivitiesApi(configuration);
    this.candidatesApi = new ATS.CandidatesApi(configuration);
  }

  createEvent(event: CalendarEvent): Promise<NewCalendarEventType> {
    throw new Error("Method not implemented.");
  }
  updateEvent(
    uid: string,
    event: CalendarEvent,
    externalCalendarId?: string | null | undefined
  ): Promise<NewCalendarEventType | NewCalendarEventType[]> {
    throw new Error("Method not implemented.");
  }
  deleteEvent(
    uid: string,
    event: CalendarEvent,
    externalCalendarId?: string | null | undefined
  ): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
  getAvailability(
    dateFrom: string,
    dateTo: string,
    selectedCalendars: IntegrationCalendar[]
  ): Promise<EventBusyDate[]> {
    throw new Error("Method not implemented.");
  }
  listCalendars(event?: CalendarEvent | undefined): Promise<IntegrationCalendar[]> {
    throw new Error("Method not implemented.");
  }
}
