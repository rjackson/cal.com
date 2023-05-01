import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Toaster } from "react-hot-toast";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Alert, Button, Form, PasswordField } from "@calcom/ui";

import appConfig from "../../config.json";
import { appKeysSchema } from "../../zod";

export default function MergeSetup() {
  const { t } = useLocale();
  const router = useRouter();

  const form = useForm<{
    apiKey: string;
    accountToken: string;
  }>({
    resolver: zodResolver(appKeysSchema),
  });
  const [errorMessage, setErrorMessage] = useState("");

  // TODO: Would be nice to give the user a list of accounts to select from.
  // Unfortunately haven't been able to figure it out myself (spent a lot of
  // time in that rabbithole, but abandoned due to API issues and useQuery
  // being slow to react to apiKey changes)

  return (
    <div className="bg-emphasis flex h-screen">
      <div className="bg-default m-auto rounded p-5 md:w-[560px] md:p-10">
        <div className="flex flex-col space-y-5 md:flex-row md:space-y-0 md:space-x-5">
          <div>
            {/* eslint-disable @next/next/no-img-element */}
            <img src="/api/app-store/merge/icon.svg" alt="Merge" className="h-12 w-12 max-w-2xl" />
          </div>
          <div>
            <h1 className="text-default">{t("merge_app_connect")}</h1>

            <div className="mt-1 text-sm">
              <p>{t("credentials_stored_encrypted")}</p>
            </div>
            <div className="my-2 mt-3">
              <Form
                form={form}
                handleSubmit={async (values) => {
                  setErrorMessage("");
                  const res = await fetch(`/api/integrations/${appConfig.slug}/add`, {
                    method: "POST",
                    body: JSON.stringify(values),
                    headers: {
                      "Content-Type": "application/json",
                    },
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    setErrorMessage(json?.message || t("something_went_wrong"));
                  } else {
                    router.push(json.url);
                  }
                }}>
                <fieldset className="space-y-2" disabled={form.formState.isSubmitting}>
                  <PasswordField
                    required
                    {...form.register("apiKey")}
                    label={t("merge_app_api_key")}
                    hint={
                      <span>
                        {t("merge_app_api_key_description")}{" "}
                        <a
                          className="text-indigo-400"
                          href="https://app.merge.dev/keys"
                          target="_blank"
                          rel="noopener noreferrer">
                          https://app.merge.dev/keys
                        </a>
                      </span>
                    }
                    data-testid="access-key-input"
                    autoComplete="off"
                  />
                  <PasswordField
                    required
                    {...form.register("accountToken")}
                    label={t("merge_app_account_token")}
                    hint={
                      <span>
                        {t("merge_app_account_token_description")}{" "}
                        <a
                          className="text-indigo-400"
                          href="https://app.merge.dev/linked-accounts/accounts"
                          target="_blank"
                          rel="noopener noreferrer">
                          https://app.merge.dev/linked-accounts/accounts
                        </a>
                      </span>
                    }
                    data-testid="account-token-input"
                    autoComplete="off"
                  />
                </fieldset>

                {errorMessage && <Alert severity="error" title={errorMessage} className="my-4" />}
                <div className="mt-5 justify-end space-x-2 rtl:space-x-reverse sm:mt-4 sm:flex">
                  <Button
                    type="button"
                    color="secondary"
                    onClick={() => router.back()}
                    data-testid="cancel-button">
                    {t("cancel")}
                  </Button>
                  <Button type="submit" loading={form.formState.isSubmitting} data-testid="save-button">
                    {t("save")}
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
