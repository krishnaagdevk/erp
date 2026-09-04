import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.schoollama.erp",
  appName: "SchooLama",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
};

export default config;
