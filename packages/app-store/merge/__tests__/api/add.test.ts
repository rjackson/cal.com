import type { User as PrismaUser } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import type { createRequest, createResponse } from "node-mocks-http";

import { prismaMock } from "../../../../../tests/config/singleton";
import { add as handleAdd } from "../../api";

type ApiRequest = NextApiRequest & ReturnType<typeof createRequest>;
type ApiResponse = NextApiResponse & ReturnType<typeof createResponse>;

const mockLinkedAccountsList = jest.fn();

jest.mock("@mergeapi/merge-sdk-typescript", () => ({
  ATS: {
    LinkedAccountsApi: jest.fn().mockImplementation(() => ({
      linkedAccountsList: mockLinkedAccountsList,
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
      },
    });

    prismaMock.user.findFirstOrThrow.mockResolvedValue({ id: 123 } as PrismaUser);
    mockLinkedAccountsList.mockRejectedValue(new Error("Your credentials are bad and you should feel bad"));

    await handleAdd(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: "Could not add Merge app",
      })
    );
    expect(mockLinkedAccountsList).toHaveBeenCalled();
    expect(prismaMock.credential.create).not.toHaveBeenCalled();
  });

  test("POST request with valid credentials should return the next URL", async () => {
    const { req, res } = createMocks<ApiRequest, ApiResponse>({
      method: "POST",
      body: {
        apiKey: "valid-api-key",
      },
    });

    prismaMock.user.findFirstOrThrow.mockResolvedValue({ id: 123 } as PrismaUser);
    mockLinkedAccountsList.mockResolvedValue([]);

    await handleAdd(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        url: "/apps/installed/other?hl=merge",
      })
    );
    expect(mockLinkedAccountsList).toHaveBeenCalled();
    expect(prismaMock.credential.create).toHaveBeenCalledWith({
      data: {
        type: "merge_other",
        key: expect.any(String),
        userId: 123,
        appId: "merge",
        invalid: false,
      },
    });
  });
});
