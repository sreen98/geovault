import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";

const WEB_CLIENT_ID =
  "40136881833-jjv6fjl4bb4he8iirctffoqc3kdg1f69.apps.googleusercontent.com";

const DRIVE_APPDATA_SCOPE =
  "https://www.googleapis.com/auth/drive.appdata";

let configured = false;

function configure(): void {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    scopes: [DRIVE_APPDATA_SCOPE],
    offlineAccess: false,
  });
  configured = true;
}

export const GoogleAuthService = {
  async signIn(): Promise<{ accessToken: string; userEmail: string }> {
    configure();
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      throw new Error("Google sign-in was cancelled");
    }

    const email = response.data.user.email;

    // Check if drive.appdata scope was granted
    const currentScopes = await GoogleSignin.getTokens();
    if (!currentScopes.accessToken) {
      // Request additional scopes if needed
      await GoogleSignin.addScopes({ scopes: [DRIVE_APPDATA_SCOPE] });
    }

    const tokens = await GoogleSignin.getTokens();
    return { accessToken: tokens.accessToken, userEmail: email };
  },

  async signOut(): Promise<void> {
    configure();
    await GoogleSignin.signOut();
  },

  async getAccessToken(): Promise<string> {
    configure();
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
  },

  isSignedIn(): boolean {
    configure();
    return GoogleSignin.getCurrentUser() !== null;
  },

  getCurrentUser(): { email: string } | null {
    configure();
    const user = GoogleSignin.getCurrentUser();
    if (!user) return null;
    return { email: user.user.email };
  },

  isUserCancelError(error: unknown): boolean {
    return isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED;
  },
};
