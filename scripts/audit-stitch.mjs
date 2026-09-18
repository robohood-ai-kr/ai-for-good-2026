import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const root = new URL("../design/stitch/v1/", import.meta.url);
for (const sector of ["manufacturing", "small-business"]) {
  for (const screen of (await readdir(new URL(`${sector}/`, root)))
    .filter((name) => /^(mf|sb)-\d+$/.test(name))
    .sort()) {
    const source = await readFile(
      new URL(`${sector}/${screen}/code.html`, root),
      "utf8",
    );
    const $ = load(source);
    const actions = $('a,button,[role="button"],[role="checkbox"]')
      .toArray()
      .map((node) => {
        const element = $(node).clone();
        element.find(".material-symbols-outlined,svg").remove();
        return {
          tag: node.tagName,
          id: node.attribs.id,
          text: element.text().trim().replace(/\s+/g, " ").slice(0, 140),
          href: node.attribs.href,
          handler: node.attribs.onclick,
          disabled: node.attribs.disabled !== undefined,
        };
      });
    const scripts = $("script")
      .toArray()
      .map((node) => ({
        src: node.attribs.src,
        id: node.attribs.id,
        code:
          node.attribs.src || node.attribs.id === "tailwind-config"
            ? undefined
            : $(node).text(),
      }));
    const urls = [
      ...new Set(source.match(/https?:\/\/[^\s"'<>;)]+/g) ?? []),
    ].map((value) => {
      try {
        return new URL(value.replaceAll("&amp;", "&")).origin;
      } catch {
        return value;
      }
    });
    const inputs = $("input,select,textarea")
      .toArray()
      .map((node) => ({
        tag: node.tagName,
        id: node.attribs.id,
        type: node.attribs.type,
        placeholder: node.attribs.placeholder,
        value: node.attribs.value,
      }));
    console.log(
      JSON.stringify({
        sector,
        screen,
        title: $("title").text(),
        actions,
        inputs,
        scripts,
        origins: [...new Set(urls)],
      }),
    );
  }
}
