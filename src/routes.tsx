import { createRoutesFromElements, Route } from "react-router";
import { Home } from "./routes/Home";

export const routes = createRoutesFromElements(
  <>
    <Route index element={<Home />} />
    {/* <Route path="about" element={<About />} /> */}
  </>,
);
