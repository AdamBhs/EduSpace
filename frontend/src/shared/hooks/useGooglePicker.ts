import { useCallback, useRef } from "react";

const DEVELOPER_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

type GooglePickerDoc = {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
};

type UseGooglePickerProps = {
  onFilePicked: (file: GooglePickerDoc) => void;
};

type TokenResponse = {
  access_token?: string;
  error?: string;
};

type PickerCallbackData = {
  action: string;
  docs: GooglePickerDoc[];
};

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export function useGooglePicker({ onFilePicked }: UseGooglePickerProps) {
  const accessTokenRef = useRef<string | null>(null);

  const openPicker = useCallback(
    (accessToken: string): void => {
      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS)
        .addView(new window.google.picker.DocsUploadView())
        .setOAuthToken(accessToken)
        .setDeveloperKey(DEVELOPER_KEY)
        .setCallback((data: PickerCallbackData) => {
          if (data.action === window.google.picker.Action.PICKED) {
            onFilePicked(data.docs[0]);
          }
        })
        .build();

      picker.setVisible(true);
    },
    [onFilePicked],
  );

  const getAccessToken = useCallback((): void => {
    if (accessTokenRef.current) {
      openPicker(accessTokenRef.current);
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: TokenResponse) => {
        if (response.access_token) {
          accessTokenRef.current = response.access_token;
          openPicker(response.access_token);
        }
      },
    });
    tokenClient.requestAccessToken();
  }, [openPicker]);

  const initGapi = useCallback((): void => {
    window.gapi.load("picker", () => {
      getAccessToken();
    });
  }, [getAccessToken]);

  const loadGapiAndPicker = useCallback((): void => {
    const loadGsi = (): void => {
      if (!window.google?.accounts) {
        const gsiScript = document.createElement("script");
        gsiScript.src = "https://accounts.google.com/gsi/client";
        gsiScript.onload = () => initGapi();
        document.body.appendChild(gsiScript);
      } else {
        initGapi();
      }
    };

    if (!window.gapi) {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => loadGsi();
      document.body.appendChild(script);
    } else {
      loadGsi();
    }
  }, [initGapi]);

  return { openPicker: loadGapiAndPicker };
}
