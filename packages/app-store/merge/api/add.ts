import { ATS, Configuration } from "@mergeapi/merge-sdk-typescript";
import type { NextApiRequest, NextApiResponse } from "next";

import { symmetricEncrypt } from "@calcom/lib/crypto";
import logger from "@calcom/lib/logger";
import prisma from "@calcom/prisma";

import getInstalledAppPath from "../../_utils/getInstalledAppPath";
import appConfig from "../config.json";
import { appKeysSchema } from "../zod";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { apiKey, accountToken } = appKeysSchema.parse(req.body);
    // Get user
    const user = await prisma.user.findFirstOrThrow({
      where: {
        id: req.session?.user?.id,
      },
      select: {
        id: true,
      },
    });

    try {
      if (!process.env.CALENDSO_ENCRYPTION_KEY) {
        throw Error("Missing encryption keys");
      }

      const encrypted = symmetricEncrypt(
        JSON.stringify({ apiKey, accountToken }),
        process.env.CALENDSO_ENCRYPTION_KEY
      );

      const data = {
        type: appConfig.type,
        key: { encrypted },
        userId: user.id,
        appId: appConfig.slug,
        invalid: false,
      };

      // Validate the api key by listing accounts
      const linkedAccountsApi = new ATS.AccountDetailsApi(
        new Configuration({ apiKey, accessToken: accountToken })
      );
      await linkedAccountsApi.accountDetailsRetrieve();

      await prisma.credential.create({
        data,
      });
    } catch (reason) {
      const message = `Could not add ${appConfig.name} app`;
      logger.error(message, reason);
      return res.status(500).json({ message });
    }

    return res
      .status(200)
      .json({ url: getInstalledAppPath({ variant: appConfig.variant, slug: appConfig.slug }) });
  }

  if (req.method === "GET") {
    return res.status(200).json({ url: `/apps/${appConfig.slug}/setup` });
  }
}
