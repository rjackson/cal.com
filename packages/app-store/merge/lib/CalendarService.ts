import type {
  Calendar,
  CalendarEvent,
  EventBusyDate,
  IntegrationCalendar,
  NewCalendarEventType,
} from "@calcom/types/Calendar";

export default class MergeCalendarService implements Calendar {
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
