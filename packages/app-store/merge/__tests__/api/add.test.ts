import type { User as PrismaUser } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import type { createRequest, createResponse } from "node-mocks-http";

import { prismaMock } from "../../../../../tests/config/singleton";
import { add as handleAdd } from "../../api";

type ApiRequest = NextApiRequest & ReturnType<typeof createRequest>;
type ApiResponse = NextApiResponse & ReturnType<typeof createResponse>;

const mockAccountDetailsRetrieve = jest.fn();

jest.mock("@mergeapi/merge-sdk-typescript", () => ({
  ATS: {
    AccountDetailsApi: jest.fn().mockImplementation(() => ({
      accountDetailsRetrieve: mockAccountDetailsRetrieve,
    })),
  },
  Configuration: jest.fn(),
}));

describe("api/add", () => {
  test("GET request redirects to set up page", async () => {
    const { req, res } = createMocks<ApiRequest, ApiResponse>({
      method: "GET",
    });

    await handleAdd(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        url: "/apps/merge/setup",
      })
    );
  });

  test("POST request with invalid credentials should return an error message", async () => {
    const { req, res } = createMocks<ApiRequest, ApiResponse>({
      method: "POST",
      body: {
        apiKey: "invalid-api-key",
        accountToken: "invalid-account-token",
      },
    });

    prismaMock.user.findFirstOrThrow.mockResolvedValue({ id: 123 } as PrismaUser);
    mockAccountDetailsRetrieve.mockRejectedValue(
      new Error("Your credentials are bad and you should feel bad")
    );

    await handleAdd(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: "Could not add Merge app",
      })
    );
    expect(mockAccountDetailsRetrieve).toHaveBeenCalled();
    expect(prismaMock.credential.create).not.toHaveBeenCalled();
  });

  test("POST request with valid credentials should return the next URL", async () => {
    const { req, res } = createMocks<ApiRequest, ApiResponse>({
      method: "POST",
      body: {
        apiKey: "valid-api-key",
        accountToken: "valid-account-token",
      },
    });

    prismaMock.user.findFirstOrThrow.mockResolvedValue({ id: 123 } as PrismaUser);
    mockAccountDetailsRetrieve.mockResolvedValue({});

    await handleAdd(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        url: "/apps/installed/other?hl=merge",
      })
    );
    expect(mockAccountDetailsRetrieve).toHaveBeenCalled();
    expect(prismaMock.credential.create).toHaveBeenCalledWith({
      data: {
        type: "merge_other_calendar",
        key: expect.any(String),
        userId: 123,
        appId: "merge",
        invalid: false,
      },
    });
  });
});
