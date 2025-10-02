import type { Context } from "@havelaer/vite-plugin-ssr";

const scripts = (js: Context["assets"]["js"]) =>
  js
    .map((js: any) =>
      "path" in js
        ? `<script src="${js.path}" type="module"></script>`
        : `<script type="module">${js.content}</script>`,
    )
    .join("\n");

const styles = (css: Context["assets"]["css"]) =>
  css.map((css: any) => `<link rel="stylesheet" href="${css.path}" />`).join("\n");

const html = (assets: Context["assets"]) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Starter</title>
    ${styles(assets.css)}
  </head>
  <body>
    <div id="root"></div>
    ${scripts(assets.js)}
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
