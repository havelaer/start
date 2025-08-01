import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import clientEntryUrl from "../entry-client.tsx?url";
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
      // TODO: restore when router ssr bug is fixed: https://github.com/TanStack/router/issues/4585
      // {
      //   type: "module",
      //   src: clientEntryUrl,
      // },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script type="module" src={clientEntryUrl} />
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
