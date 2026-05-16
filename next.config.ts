import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Allow image uploads (avatar) larger than the 1 MB Server Action default.
    // iPhone photos are routinely 3-8 MB. App-level cap is 5 MB; the 10 MB
    // margin here absorbs multipart overhead.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default withNextIntl(nextConfig);
