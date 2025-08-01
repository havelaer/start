import * as styles from "./Greeting.css";

export function Greeting({ name = "World" }: { name?: string }) {
  return <h3 className={styles.root}>Hello, {name}!</h3>;
}
