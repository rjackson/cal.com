import { useState } from "react";

import { useAppContextWithSchema } from "@calcom/app-store/EventTypeAppContext";
import AppCard from "@calcom/app-store/_components/AppCard";
import type { EventTypeAppCardComponent } from "@calcom/app-store/types";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { PasswordField, SettingsToggle, TextField } from "@calcom/ui";

import type { appDataSchema } from "../zod";

const EventTypeAppCard: EventTypeAppCardComponent = function EventTypeAppCard({ eventType, app }) {
  const { t } = useLocale();
  const [getAppData, setAppData] = useAppContextWithSchema<typeof appDataSchema>();
  const [enabled, setEnabled] = useState(getAppData("enabled"));

  const endpoint = getAppData("endpoint");
  const [customEndpointToggle, setCustomEndpointToggle] = useState(!!endpoint);

  const vault = getAppData("__vault") ?? { decrypted: {} };
  const getVaultData = (key: string) => {
    return vault?.decrypted?.[key];
  };
  const setVaultData = (key: string, value: string) => {
    setAppData("__vault", {
      ...vault,
      decrypted: {
        ...vault.decrypted,
        [key]: value,
      },
    });
  };

  return (
    <AppCard setAppData={setAppData} app={app} switchOnClick={(e) => setEnabled(e)} switchChecked={enabled}>
      <div className="space-y-4">
        <PasswordField
          name={t("file-upload-amazon-s3_api-key")}
          value={getVaultData("apiKey")}
          onChange={(e) => setVaultData("apiKey", e.target.value)}
        />
        <TextField
          name={t("file-upload-amazon-s3_bucket")}
          value={getAppData("bucket")}
          onChange={(e) => setAppData("bucket", e.target.value)}
        />{" "}
        <hr className="border-subtle" />
        <SettingsToggle
          title={t("file-upload-amazon-s3_endpoint_toggle")}
          description={t("file-upload-amazon-s3_endpoint_toggle_description")}
          checked={customEndpointToggle}
          onCheckedChange={(active) => {
            setCustomEndpointToggle(active);
            if (!active) {
              setAppData("endpoint", undefined);
            }
          }}>
          <TextField
            name={t("file-upload-amazon-s3_endpoint")}
            hint={t("file-upload-amazon-s3_endpoint_description")}
            value={endpoint}
            onChange={(e) => setAppData("endpoint", e.target.value)}
          />{" "}
        </SettingsToggle>
      </div>
    </AppCard>
  );
};

export default EventTypeAppCard;
