import clientEntryId from "virtual:framework/entry-client-id";
import viteHead from "virtual:framework/vite-head";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { RouterContext } from "../routerContext";

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    links: [{ rel: "icon", href: "/images/favicon.ico" }],
    meta: [
      {
        title: "Havelaer Start",
      },
      {
        charSet: "UTF-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0",
      },
    ],
    scripts: [
      ...viteHead.map((script: any) => ({
        type: "module",
        src: script.src,
        children: script.content,
      })),
      {
        src: "https://unpkg.com/@tailwindcss/browser@4",
      },
      {
        type: "module",
        src: clientEntryId,
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div>
          <Link
            to="/"
            activeProps={{
              className: "font-bold",
            }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>{" "}
          <Link
            to="/posts"
            activeProps={{
              className: "font-bold",
            }}
          >
            Posts
          </Link>{" "}
          <Link
            to="/error"
            activeProps={{
              className: "font-bold",
            }}
          >
            Error
          </Link>
        </div>
        <hr />
        <Outlet /> {/* Start rendering router matches */}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
