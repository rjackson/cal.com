import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/router";

import type { IntegrationOAuthCallbackState } from "@calcom/app-store/types";
import { WEBAPP_URL } from "@calcom/lib/constants";
import type { App } from "@calcom/types/App";

import getInstalledAppPath from "./getInstalledAppPath";

type CustomUseMutationOptions =
  | Omit<UseMutationOptions<unknown, unknown, unknown, unknown>, "mutationKey" | "mutationFn" | "onSuccess">
  | undefined;

type AddAppMutationData = {
  url: string;
  newTab: boolean;
  setupPending: boolean;
  isOmniInstall: boolean;
  externalUrl: boolean;
} | void;
type UseAddAppMutationOptions = CustomUseMutationOptions & {
  onSuccess?: (data: AddAppMutationData) => void;
  installGoogleVideo?: boolean;
  returnTo?: string;
};

function useAddAppMutation(_type: App["type"] | null, allOptions?: UseAddAppMutationOptions) {
  const { returnTo, ...options } = allOptions || {};
  const router = useRouter();
  const mutation = useMutation<
    AddAppMutationData,
    Error,
    { type?: App["type"]; variant?: string; slug?: string; isOmniInstall?: boolean } | ""
  >(async (variables) => {
    let type: string | null | undefined;
    let isOmniInstall;
    if (variables === "") {
      type = _type;
    } else {
      isOmniInstall = variables.isOmniInstall;
      type = variables.type;
    }
    if (type?.endsWith("_other_calendar")) {
      type = type.split("_other_calendar")[0];
    }

    if (options?.installGoogleVideo && type !== "google_calendar")
      throw new Error("Could not install Google Meet");

    const state: IntegrationOAuthCallbackState = {
      returnTo:
        returnTo ||
        WEBAPP_URL +
          getInstalledAppPath(
            { variant: variables && variables.variant, slug: variables && variables.slug },
            location.search
          ),
      ...(type === "google_calendar" && { installGoogleVideo: options?.installGoogleVideo }),
    };
    const stateStr = encodeURIComponent(JSON.stringify(state));
    const searchParams = `?state=${stateStr}`;

    const res = await fetch(`/api/integrations/${type}/add` + searchParams);

    if (!res.ok) {
      const errorBody = await res.json();
      throw new Error(errorBody.message || "Something went wrong");
    }

    const { url, newTab } = await res.json();
    const externalUrl = /https?:\/\//.test(url) && !url.startsWith(window.location.origin);
    const setupPending = externalUrl || url.endsWith("/setup");

    return { url, newTab, setupPending, isOmniInstall: !!isOmniInstall, externalUrl };
  }, options);

  if (mutation.data !== undefined && mutation.data.setupPending) {
    const { url, newTab, isOmniInstall, externalUrl } = mutation.data;

    // Skip redirection only if it is an OmniInstall and redirect URL isn't of some other origin
    // This allows installation of apps like Stripe to still redirect to their authentication pages.
    if (isOmniInstall && !externalUrl) {
      return mutation;
    }

    // If we have an external url (e.g. Stripe), redirect via window
    if (externalUrl) {
      if (newTab) {
        window.open(url, "_blank");
        return;
      }

      window.location.href = url;

      return mutation;
    }

    // If we're down here, we have a local set up page
    router.push(url);
  }

  return mutation;
}

export default useAddAppMutation;
