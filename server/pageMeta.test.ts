import assert from "node:assert/strict";
import { test } from "node:test";
import { comparePageMeta, parsePageMeta } from "./pageMeta.js";

test("Yen Press c/p tokens", () => {
  const meta = parsePageMeta(
    "Delicious in Dungeon - c008 (v02) - p002-p003 [Yen Press] [Digital] [1r0n].jpg"
  );
  assert.deepEqual(meta, { chapter: 8, page: 2, suffix: "" });
});

test("Arienai c/p with letter suffix", () => {
  const meta = parsePageMeta(
    "Billy Bat, v01 (2009) [Arienai!]/Billy_Bat_v01c001p000a.jpg"
  );
  assert.deepEqual(meta, { chapter: 1, page: 0, suffix: "a" });
});

test("Billy Bat v13 mixed scanlation names", () => {
  assert.deepEqual(parsePageMeta("Billy_Bat_102_01[Mangaholic].jpg"), {
    chapter: 102,
    page: 1,
    suffix: "",
  });
  assert.deepEqual(parsePageMeta("BillyBat106_04a.jpg"), {
    chapter: 106,
    page: 4,
    suffix: "a",
  });
  assert.deepEqual(parsePageMeta("Billy_Bat_102_03-04[Mangaholic].jpg"), {
    chapter: 102,
    page: 3,
    suffix: "",
  });
});

test("Billy Bat folder chapter token plus page in filename", () => {
  const meta = parsePageMeta(
    "Billy Bat, v12 (2013) [Red Hawk Scans + Mangaholic]/Billy Bat v12 c094/01_Billy_Bat94_00_RHS.jpg"
  );
  assert.deepEqual(meta, { chapter: 94, page: 0, suffix: "" });
});

test("Billy Bat compact chapter_page with group suffix", () => {
  const meta = parsePageMeta("Billy_Bat_86_RHS/Billy_Bat86_00a_RHS.jpg");
  assert.deepEqual(meta, { chapter: 86, page: 0, suffix: "a" });
});

test("volume tokens do not override the chapter/page pair", () => {
  assert.deepEqual(parsePageMeta("Billy_Bat_v13_102_01[Mangaholic].jpg"), {
    chapter: 102,
    page: 1,
    suffix: "",
  });
  assert.deepEqual(parsePageMeta("Billy_Bat_v13_106_04a.jpg"), {
    chapter: 106,
    page: 4,
    suffix: "a",
  });
});

test("cover pages stay chapter 0", () => {
  assert.deepEqual(parsePageMeta("Billy Bat, v13 (2013) [Mangaholic]/0000.jpg"), {
    chapter: 0,
    page: 0,
    suffix: "",
  });
});

test("volume 13 zip order is corrected by chapter then page", () => {
  const files = [
    "BillyBat106_01.png",
    "Billy_Bat_102_01[Mangaholic].jpg",
    "0000.jpg",
    "Billy_Bat_102_02[Mangaholic].jpg",
    "BillyBat106_04a.jpg",
    "BillyBat106_04.png",
  ];
  const sorted = [...files].sort((a, b) =>
    comparePageMeta(parsePageMeta(a), parsePageMeta(b), a, b)
  );
  assert.deepEqual(sorted, [
    "0000.jpg",
    "Billy_Bat_102_01[Mangaholic].jpg",
    "Billy_Bat_102_02[Mangaholic].jpg",
    "BillyBat106_01.png",
    "BillyBat106_04.png",
    "BillyBat106_04a.jpg",
  ]);
});

test("volume labels do not override the chapter/page pair", () => {
  assert.deepEqual(parsePageMeta("Billy_Bat_v13_102_01[Mangaholic].jpg"), {
    chapter: 102,
    page: 1,
    suffix: "",
  });

  assert.deepEqual(parsePageMeta("Billy_Bat_Volume_13_102_01[Mangaholic].jpg"), {
    chapter: 102,
    page: 1,
    suffix: "",
  });

  assert.deepEqual(parsePageMeta("Billy_Bat_Vol_13_106_04a.jpg"), {
    chapter: 106,
    page: 4,
    suffix: "a",
  });

  assert.deepEqual(parsePageMeta("Billy_Bat_vol_13_106_04a.jpg"), {
    chapter: 106,
    page: 4,
    suffix: "a",
  });
});
