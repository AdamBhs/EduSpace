import { Application } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";

interface RouteConfig {
  prefix: string;
  target: string;
  pathRewrite: Record<string, string>;
}

const routes: RouteConfig[] = [
  {
    prefix: "/users",
    target: process.env.USER_SERVICE_URL || "http://localhost:3002",
    pathRewrite: { "^/users": "" },
  },
  {
    prefix: "/classroom",
    target: process.env.CLASS_SERVICE_URL || "http://localhost:3003",
    pathRewrite: { "^/classroom": "" },
  },
  {
    prefix: "/content",
    target: process.env.CONTENT_SERVICE_URL || "http://localhost:3004",
    pathRewrite: { "^/content": "" },
  },
  {
    prefix: "/chat",
    target: process.env.COMMUNICATION_SERVICE_URL || "http://localhost:3005",
    pathRewrite: { "^/chat": "" },
  },
  {
    prefix: "/dm",
    target: process.env.COMMUNICATION_SERVICE_URL || "http://localhost:3005",
    pathRewrite: { "^/dm": "" },
  },
  {
    prefix: "/notifications",
    target: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3006",
    pathRewrite: { "^/notifications": "" },
  },
  {
    prefix: "/search",
    target: process.env.SEARCH_SERVICE_URL || "http://localhost:3007",
    pathRewrite: { "^/search": "" },
  },
  {
    prefix: "/files",
    target: process.env.FILE_SERVICE_URL || "http://localhost:3010",
    pathRewrite: { "^/files": "" },
  },
];

export function setupProxies(app: Application): void {
  for (const route of routes) {
    const options: Options = {
      target: route.target,
      changeOrigin: true,
      pathRewrite: route.pathRewrite,
      on: {
        error: (err, req, res) => {
          console.error(`Proxy error [${route.prefix}]:`, err.message);
          if ("status" in res && typeof res.status === "function") {
            (res as any).status(502).json({
              success: false,
              error: `Service unavailable: ${route.prefix}`,
            });
          }
        },
      },
    };

    app.use(route.prefix, createProxyMiddleware(options));
  }
}
