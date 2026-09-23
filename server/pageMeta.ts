export interface PageMeta {
  chapter: number;
  page: number;
  suffix: string;
}

function basenameWithoutExt(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, "");
  return base.replace(/\.[^.]+$/, "");
}

function stripTags(name: string): string {
  return name.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").trim();
}

function stripVolumeTokens(name: string): string {
  return name.replace(
    /(?:^|[^a-zA-Z])(?:v|vol(?:ume)?)\s*\.?\s*[-_ ]?\s*0*(\d+)\b/gi,
    " "
  );
}

export function parsePageMeta(filename: string): PageMeta {
  const explicitChapter = filename.match(/(?:^|[^a-zA-Z])c(\d+)/i);
  const explicitPage = filename.match(
    /(?:^|[^a-zA-Z])p(\d+)(?:-p?\d+)?([a-z])?/i
  );

  let chapter = explicitChapter ? parseInt(explicitChapter[1], 10) : 0;
  let page = explicitPage ? parseInt(explicitPage[1], 10) : -1;
  let suffix = explicitPage?.[2]?.toLowerCase() ?? "";

  const stripped = stripVolumeTokens(stripTags(basenameWithoutExt(filename)));

  if (page < 0) {
    const scanlation = [...stripped.matchAll(/(\d+)[_-](\d+)(?:-\d+)?([a-z])?/gi)]
      .filter((match) => {
        const prevChar = stripped.slice(0, match.index).at(-1)?.toLowerCase();
        return prevChar !== "v";
      })
      .at(-1);

    if (scanlation) {
      if (!chapter) chapter = parseInt(scanlation[1], 10);
      page = parseInt(scanlation[2], 10);
      suffix = scanlation[3]?.toLowerCase() ?? "";
    }
  }

  if (page < 0) {
    const cover = stripped.match(/^(\d+)$/);
    page = cover ? parseInt(cover[1], 10) : 9999;
  }

  return { chapter, page, suffix };
}

export function comparePageMeta(
  a: PageMeta,
  b: PageMeta,
  fileA: string,
  fileB: string
): number {
  if (a.chapter !== b.chapter) return a.chapter - b.chapter;
  if (a.page !== b.page) return a.page - b.page;
  if (a.suffix !== b.suffix) {
    if (a.suffix < b.suffix) return -1;
    if (a.suffix > b.suffix) return 1;
  }
  return fileA.localeCompare(fileB, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}
