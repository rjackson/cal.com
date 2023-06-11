import { faker } from "@faker-js/faker";
import { mapLimit } from "async";
import * as os from "os";

import dayjs from "@calcom/dayjs";
import { hashPassword } from "@calcom/features/auth/lib/hashPassword";

import prisma from ".";
import type { User } from "./client";
import { MembershipRole } from "./enums";
import { createTeamAndAddUsers, createUserAndEventType } from "./seed-utils";

async function main() {
  /**
   * Use this seed file to fill the database with a large amount of test data, to allow performance testing and
   * benchmarking that will be a better reflection of production than an empty test database.
   */
  const usersToCreate = 1e3;
  const eventTypesPerUser = { min: 1, max: 4 };
  const bookingsPerEventType = { min: 0, max: 20 };
  const probablyOfManagedEvents = 0.2;

  const teamsToCreate = 10;

  let usersCreated = 0;
  let eventTypesCreated = 0;
  let bookingsCreated = 0;
  let teamsCreated = 0;

  // Track created event types, so we can occasionally emulate managed event types
  const eventTypeIds: number[] = [];

  // Track created users so we can randomly allocate some to teams
  const createdUsers: User[] = [];

  // Fixed password used for all benchmark accounts, to avoid computational cost of hasing
  const password = await hashPassword("Passw0rd");
  await mapLimit(Array.from({ length: usersToCreate }), os.cpus().length, async () => {
    const user = {
      email: faker.internet.exampleEmail().toLowerCase(), // cal.com doesn't seem to like mixed-case emails
      name: faker.person.fullName(),
      password,
      username: faker.internet.userName(),
    };

    const eventTypes = Array.from({ length: faker.number.int(eventTypesPerUser) }, () => {
      const title = `${faker.word.adjective()} ${faker.word.verb()}`;
      const length = faker.helpers.arrayElement([10, 15, 30, 45, 60]);

      const bookings = Array.from({ length: faker.number.int(bookingsPerEventType) }, () => {
        const startTime = faker.date.anytime();
        const endTime = dayjs(startTime).add(length, "minutes").toDate();

        return {
          uid: faker.string.uuid(),
          title: `${title} between ${user.name} and ${faker.person.fullName()}`,
          startTime,
          endTime,
        };
      });

      bookingsCreated += bookings.length;
      return {
        title,
        slug: faker.helpers.slugify(title),
        length,
        parentId:
          faker.datatype.boolean({ probability: probablyOfManagedEvents }) && eventTypeIds.length > 0
            ? faker.helpers.arrayElement(eventTypeIds)
            : undefined,
        description: faker.lorem.paragraphs(4),
        _bookings: bookings,
      };
    });

    eventTypesCreated += eventTypes.length;
    try {
      usersCreated++;
      const [newUser, newEventTypeIds] = await createUserAndEventType({
        user,
        eventTypes,
        skipHashing: true,
      });
      createdUsers.push(newUser);
      eventTypeIds.push(...newEventTypeIds);
    } catch (e) {
      console.error(e);
      eventTypesCreated -= eventTypes.length;
      bookingsCreated -= eventTypes.reduce((s, e) => s + e._bookings.length, 0);
      usersCreated--;
    }
  });

  await mapLimit(Array.from({ length: teamsToCreate }), os.cpus().length, async () => {
    const name = faker.company.name();
    const slug = faker.helpers.slugify(name);

    const users = faker.helpers
      .arrayElements(createdUsers, faker.number.int({ min: 1, max: 10 }))
      .map(({ id, username }) => ({ id, username: username ?? "Unknown", role: MembershipRole.MEMBER }));

    try {
      teamsCreated++;

      await createTeamAndAddUsers(
        {
          name,
          slug,
          eventTypes: {
            createMany: {
              data: [
                {
                  title: "Collective Seeded Team Event",
                  slug: "collective-seeded-team-event",
                  length: 15,
                  schedulingType: "COLLECTIVE",
                },
                {
                  title: "Round Robin Seeded Team Event",
                  slug: "round-robin-seeded-team-event",
                  length: 15,
                  schedulingType: "ROUND_ROBIN",
                },
              ],
            },
          },
          createdAt: new Date(),
        },
        users
      );
    } catch (e) {
      teamsCreated--;
      console.error(e);
    }
  });

  console.log(
    `🎉 Create ${usersCreated} users, ${eventTypesCreated} event types, ${bookingsCreated} bookings, and ${teamsCreated} teams`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
