import type { Context, HtmlAssets } from "@havelaer/vite-plugin-ssr";

const html = (assets: HtmlAssets) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Starter</title>
    ${assets.css.map((css) => `<link rel="stylesheet" href="${css}" />`).join("\n")}
  </head>
  <body>
    <div id="root"></div>
    <script src="${assets.js}" type="module"></script>
  </body>
</html>
`;

export default async function fetch(_request: Request, ctx: Context): Promise<Response> {
  return new Response(html(ctx.assets), {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
