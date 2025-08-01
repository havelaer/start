import { Await, createFileRoute } from "@tanstack/react-router";

export type CommentType = {
  id: string;
  postId: string;
  name: string;
  email: string;
  body: string;
};

async function fetchComments(postId: string) {
  await new Promise((r) => setTimeout(r, 2000));

  return fetch(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`).then(
    (r) => r.json() as Promise<Array<CommentType>>,
  );
}

export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params: { postId }, context }) => {
    const commentsPromise = fetchComments(postId);
    const post = await context.rpc.posts.detail({ id: postId });

    return {
      post,
      commentsPromise: commentsPromise,
    };
  },
  wrapInSuspense: true,
  errorComponent: ({ error }) => {
    return <div>Failed to load post: {(error as any).message}</div>;
  },
  notFoundComponent: () => {
    return <div>Post not found</div>;
  },
  component: PostComponent,
});

function PostComponent() {
  const { post, commentsPromise } = Route.useLoaderData();

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{post.title}</h4>
      <div className="text-sm">{post.body}</div>
      <Await promise={commentsPromise} fallback={<div>Loading comments...</div>} key={post.id}>
        {(comments) => {
          return (
            <div className="space-y-2">
              <h5 className="text-lg font-bold underline">Comments</h5>
              {comments.map((comment) => {
                return (
                  <div key={comment.id}>
                    <h6 className="text-md font-bold">{comment.name}</h6>
                    <div className="text-sm italic opacity-50">{comment.email}</div>
                    <div className="text-sm">{comment.body}</div>
                  </div>
                );
              })}
            </div>
          );
        }}
      </Await>
    </div>
  );
}
