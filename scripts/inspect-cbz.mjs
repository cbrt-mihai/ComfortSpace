import path from "node:path";
import { listCbzPages } from "../server/cbz.ts";

const pages = await listCbzPages(
  path.join(
    "D:/GitHub/ComfortSpace/data/manga/[Pajeet] Billy Bat",
    "Billy Bat, v01 (2009) [Arienai!].cbz"
  )
);
pages.slice(0, 5).forEach((p) => console.log(p));
