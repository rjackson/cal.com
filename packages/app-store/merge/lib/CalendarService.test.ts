import { ATS, Configuration } from "@mergeapi/merge-sdk-typescript";

import { symmetricDecrypt } from "@calcom/lib/crypto";
import logger from "@calcom/lib/logger";
import type { CredentialPayload } from "@calcom/types/Credential";

import CalendarService from "./CalendarService";

jest.mock("@mergeapi/merge-sdk-typescript");
jest.mock("@calcom/lib/crypto");
jest.mock("@calcom/lib/logger");

export const mockedConfiguration = Configuration as jest.MockedClass<typeof Configuration>;
export const mockedActivitiesApi = ATS.ActivitiesApi as jest.MockedClass<typeof ATS.ActivitiesApi>;
export const mockedCandidatesApi = ATS.CandidatesApi as jest.MockedClass<typeof ATS.CandidatesApi>;

const mockedSymmetricDecrypt = symmetricDecrypt as jest.MockedFunction<typeof symmetricDecrypt>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

const credentialKeys = {
  encrypted: "testEncrypted",
};
const credential: CredentialPayload = {
  id: 1234,
  userId: 1234,
  appId: "merge",
  type: "merge_other_calendar",
  key: credentialKeys,
  invalid: false,
};

describe("CalendarService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    test("should initialize with valid credentials", () => {
      const decrypted = '{"apiKey": "testApiKey", "accountToken": "testAccountToken"}';
      mockedSymmetricDecrypt.mockReturnValueOnce(decrypted);

      new CalendarService(credential);

      expect(mockedSymmetricDecrypt).toHaveBeenCalledWith(credentialKeys.encrypted, expect.any(String));
      expect(mockedConfiguration).toHaveBeenCalledWith({
        apiKey: "testApiKey",
        accessToken: "testAccountToken",
      });
      expect(mockedActivitiesApi).toHaveBeenCalled();
      expect(mockedCandidatesApi).toHaveBeenCalled();
      expect(mockedLogger.getChildLogger).toHaveBeenCalledWith({
        prefix: [`[[lib] merge_other_calendar`],
      });
    });

    test("should throw an error with invalid credentials", () => {
      const invalidCredential: CredentialPayload = {
        ...credential,
        key: {
          missingEncryptionKey: "ohNo",
        },
      };

      expect(() => new CalendarService(invalidCredential)).toThrowError(
        `No api credentials found for userId 1234 and appId merge`
      );
    });
  });
});
