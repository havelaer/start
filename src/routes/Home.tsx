import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";
import viteLogo from "/vite.svg";
import reactLogo from "../assets/react.svg";
import { orpc } from "../utils/orpc.ts";
import * as css from "./Home.css.ts";

export function Home() {
  const [count, setCount] = useState(0);
  const { data } = useQuery(orpc.users.listUsers.queryOptions({ input: { limit: 10 } }));

  console.log(data);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noopener">
          <img src={viteLogo} className={css.logo} alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener">
          <img src={reactLogo} className={clsx(css.logo, css.logoReact)} alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className={css.card}>
        <button onClick={() => setCount((count) => count + 1)} type="button">
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className={css.readTheDocs}>Click on the Vite and React logos to learn more</p>
    </>
  );
}
