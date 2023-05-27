import type { GetRecordingsResponseSchema, GetAccessLinkResponseSchema } from "@calcom/prisma/zod-utils";
import type { CalendarEvent, EventBusyDate } from "@calcom/types/Calendar";
import type { CredentialPayload } from "@calcom/types/Credential";
import type { PartialReference } from "@calcom/types/EventManager";
import type { VideoApiAdapter, VideoCallData } from "@calcom/types/VideoApiAdapter";

import appConfig from "../config.json";

const BlueJeansVideoApiAdapter = (credential: CredentialPayload): VideoApiAdapter => {
  // TODO: README for setting up "developer application" in BlueJeans. Might require liaison with BlueJeans?
  // TODO: Authentication via Application Token: /oauth2/token#Application
  // https://docs.bluejeans.com/Techdocs/Auth_Tokens.htm

  return {
    async createMeeting(event: CalendarEvent): Promise<VideoCallData> {
      // TODO "Create Meeting" of https://bluejeans.github.io/api-rest-meetings/site/index.html#operations-tag-Meeting
      return {
        type: appConfig.type,
        id: "",
        password: "",
        url: "",
      };
    },

    async updateMeeting(bookingRef: PartialReference, event: CalendarEvent): Promise<VideoCallData> {
      // TODO "Update Meeting" of https://bluejeans.github.io/api-rest-meetings/site/index.html#operations-tag-Meeting
      return {
        type: appConfig.type,
        id: "",
        password: "",
        url: "",
      };
    },

    async deleteMeeting(uid: string): Promise<unknown> {
      // TODO "Cancel Meeting" of https://bluejeans.github.io/api-rest-meetings/site/index.html#operations-tag-Meeting
      return;
    },

    async getAvailability(dateFrom?: string, dateTo?: string): Promise<EventBusyDate[]> {
      // TODO "List Meetings"? of https://bluejeans.github.io/api-rest-meetings/site/index.html#operations-tag-Meeting
      return [];
    },

    async getRecordings(roomName: string): Promise<GetRecordingsResponseSchema> {
      // TODO (Optional) "Get All Recordings For A Specified Meeting ID" of https://bluejeans.github.io/api-rest-meetings/site/index.html#operations-tag-Recording
      return {
        total_count: 0,
        data: [],
      };
    },

    // Optional
    async getRecordingDownloadLink(recordingId: string): Promise<GetAccessLinkResponseSchema> {
      // TODO (Optional) "Get Recording Download Link" of https://bluejeans.github.io/api-rest-meetings/site/index.html#operations-tag-Recording
      return {
        download_link: "",
      };
    },
  };
};

export default BlueJeansVideoApiAdapter;
