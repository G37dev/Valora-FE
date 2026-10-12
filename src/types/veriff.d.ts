declare module "@veriff/react-native-sdk" {
  export interface VeriffLaunchOptions {
    sessionUrl: string;
  }

  export interface VeriffResult {
    status: string;
    error?: string;
  }

  const VeriffSdk: {
    launchVeriff(options: VeriffLaunchOptions): Promise<VeriffResult>;
    statusDone: string;
    statusCanceled: string;
    statusError: string;
  };

  export default VeriffSdk;
}
