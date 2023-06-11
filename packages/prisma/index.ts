import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import { bookingReferenceMiddleware } from "./middleware";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaOptions: Prisma.PrismaClientOptions = {};

if (!!process.env.NEXT_PUBLIC_DEBUG) prismaOptions.log = [{ level: "query", emit: "event" }, "error", "warn"];

export const prisma = new PrismaClient(prismaOptions);

export const customPrisma = (options: Prisma.PrismaClientOptions) =>
  new PrismaClient({ ...prismaOptions, ...options });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

if (!!process.env.NEXT_PUBLIC_DEBUG) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  prisma.$on("query", (e) => {
    if ("query" in e && "params" in e && "duration" in e) {
      console.log("Query: " + e.query);
      console.log("Params: " + e.params);
      console.log("Duration: " + e.duration + "ms");
    }
  });
}
// If any changed on middleware server restart is required
bookingReferenceMiddleware(prisma);

export default prisma;

export * from "./selects";
