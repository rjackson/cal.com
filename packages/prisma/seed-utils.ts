import type { Prisma, User, UserPermissionRole } from "@prisma/client";

import { hashPassword } from "@calcom/features/auth/lib/hashPassword";
import { DEFAULT_SCHEDULE, getAvailabilityFromSchedule } from "@calcom/lib/availability";
import { MembershipRole } from "@calcom/prisma/enums";

import prisma from ".";

export async function createUserAndEventType(opts: {
  user: {
    email: string;
    password: string;
    username: string;
    name: string;
    completedOnboarding?: boolean;
    timeZone?: string;
    role?: UserPermissionRole;
  };
  eventTypes: Array<
    Prisma.EventTypeCreateInput & {
      _bookings?: Prisma.BookingCreateInput[];
    }
  >;
  skipHashing?: boolean;
}): Promise<[User, number[]]> {
  const password = opts.skipHashing ? opts.user.password : await hashPassword(opts.user.password);

  const userData = {
    ...opts.user,
    password,
    emailVerified: new Date(),
    completedOnboarding: opts.user.completedOnboarding ?? true,
    locale: "en",
    schedules:
      opts.user.completedOnboarding ?? true
        ? {
            create: {
              name: "Working Hours",
              availability: {
                createMany: {
                  data: getAvailabilityFromSchedule(DEFAULT_SCHEDULE),
                },
              },
            },
          }
        : undefined,
  };

  const user = await prisma.user.upsert({
    where: { email: opts.user.email },
    update: userData,
    create: userData,
  });

  console.log(
    `👤 Upserted '${opts.user.username}' with email "${opts.user.email}" & password "${opts.user.password}". Booking page 👉 ${process.env.NEXT_PUBLIC_WEBAPP_URL}/${opts.user.username}`
  );

  const eventTypeIds: number[] = [];
  for (const eventTypeInput of opts.eventTypes) {
    const { _bookings: bookingFields = [], ...eventTypeData } = eventTypeInput;
    eventTypeData.userId = user.id;
    eventTypeData.users = { connect: { id: user.id } };

    const eventType = await prisma.eventType.findFirst({
      where: {
        slug: eventTypeData.slug,
        users: {
          some: {
            id: eventTypeData.userId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (eventType) {
      console.log(
        `\t📆 Event type ${eventTypeData.slug} already seems seeded - ${process.env.NEXT_PUBLIC_WEBAPP_URL}/${user.username}/${eventTypeData.slug}`
      );
      continue;
    }
    const { id } = await prisma.eventType.create({
      data: eventTypeData,
    });
    eventTypeIds.push(id);

    console.log(
      `\t📆 Event type ${eventTypeData.slug} with id ${id}, length ${eventTypeData.length}min - ${process.env.NEXT_PUBLIC_WEBAPP_URL}/${user.username}/${eventTypeData.slug}`
    );
    for (const bookingInput of bookingFields) {
      await prisma.booking.create({
        data: {
          ...bookingInput,
          user: {
            connect: {
              email: opts.user.email,
            },
          },
          attendees: {
            create: {
              email: opts.user.email,
              name: opts.user.name,
              timeZone: "Europe/London",
            },
          },
          eventType: {
            connect: {
              id,
            },
          },
          status: bookingInput.status,
        },
      });
      console.log(
        `\t\t☎️ Created booking ${bookingInput.title} at ${new Date(
          bookingInput.startTime
        ).toLocaleDateString()}`
      );
    }
  }

  return [user, eventTypeIds];
}

export async function createTeamAndAddUsers(
  teamInput: Prisma.TeamCreateInput,
  users: { id: number; username: string; role?: MembershipRole }[]
) {
  const createTeam = async (team: Prisma.TeamCreateInput) => {
    try {
      return await prisma.team.create({
        data: {
          ...team,
        },
      });
    } catch (_err) {
      if (_err instanceof Error && _err.message.indexOf("Unique constraint failed on the fields") !== -1) {
        console.log(`Team '${team.name}' already exists, skipping.`);
        return;
      }
      throw _err;
    }
  };

  const team = await createTeam(teamInput);
  if (!team) {
    return;
  }

  console.log(
    `🏢 Created team '${teamInput.name}' - ${process.env.NEXT_PUBLIC_WEBAPP_URL}/team/${team.slug}`
  );

  for (const user of users) {
    const { role = MembershipRole.OWNER, id, username } = user;
    await prisma.membership.create({
      data: {
        teamId: team.id,
        userId: id,
        role: role,
        accepted: true,
      },
    });
    console.log(`\t👤 Added '${teamInput.name}' membership for '${username}' with role '${role}'`);
  }
}
