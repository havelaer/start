import { ORPCError, os } from "@orpc/server";
import * as z from "zod";

export type PostType = {
  id: string;
  title: string;
  body: string;
};

const PostTypeSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
});

const listPosts = os.handler(async () => {
  console.info("Server: Fetching posts...");
  const posts = await fetch("https://jsonplaceholder.typicode.com/posts")
    .then((d) => d.json() as Promise<Array<PostType>>)
    .then((d) => d.slice(0, 10));

  return posts;
});

const detailPost = os.input(PostTypeSchema.pick({ id: true })).handler(async ({ input }) => {
  console.info("Server: Fetching post detail...", input.id);
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${input.id}`);

  if (res.status === 404) throw new ORPCError("Post not found", { status: 404 });

  return res.json() as Promise<PostType>;
});

export const rpcRouter = {
  posts: {
    list: listPosts,
    detail: detailPost,
  },
};
