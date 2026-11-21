"""Build the lobby's on-demand WOFF2 files from its complete local font subset."""

import hashlib
import json
from pathlib import Path
import re
import subprocess

from fontTools import subset
from fontTools.ttLib import TTFont


fonts = Path(__file__).resolve().parent
site = fonts.parent.parent
source = fonts / "huiwen-mincho-lobby.woff2"
page = site / "games.html"

# Read the actual registry, including entries appended after the initial array.
read_labels = """
const labels = [], otherTitles = [], introductions = [];
global.window = { BooplandI18n: { register(scope, messages) {
  for (const words of Object.values(messages)) labels.push(...Object.values(words));
} } };
require('./games-i18n.js');
require('./gamelist.js');
for (const [index, game] of window.GAME_LIST.entries()) {
  const locales = Object.values(game.locales || {});
  const titles = [game.title, ...locales.map(words => words.title)];
  if (index < 12 || game.tags?.includes('推荐')) {
    labels.push(...titles);
    introductions.push(game.description, ...locales.map(words => words.description));
  } else {
    otherTitles.push(...titles);
  }
}
process.stdout.write(JSON.stringify([labels.join(' '), otherTitles.join(' '), introductions.join(' ')]));
"""
labels, other_titles, intros = json.loads(subprocess.check_output(
    ["node", "-"], input=read_labels.encode("utf-8"), cwd=site))
labels += (site / "i18n.js").read_text(encoding="utf-8")
with TTFont(source) as font:
    all_chars = set(font.getBestCmap())
han = {code for code in all_chars if 0x3400 <= code <= 0x9FFF}
titles = han.intersection(map(ord, labels))
intro_chars = han.intersection(map(ord, intros)) - titles
later_titles = han.intersection(map(ord, other_titles)) - titles - intro_chars
parts = {"text": all_chars - han, "details": han - titles - intro_chars - later_titles,
         "later-titles": later_titles, "introductions": intro_chars, "titles": titles}


def unicode_ranges(chars):
    spans = []
    for code in sorted(chars):
        if spans and code == spans[-1][1] + 1:
            spans[-1][1] = code
        else:
            spans.append([code, code])
    return ", ".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in spans)

rules = []
for name, chars in parts.items():
    output = fonts / f"huiwen-lobby-{name}.woff2"
    with TTFont(source, recalcTimestamp=False) as font:
        options = subset.Options()
        options.name_IDs = ["*"]
        options.name_legacy = True
        options.name_languages = ["*"]
        selected = subset.Subsetter(options=options)
        selected.populate(unicodes=chars)
        selected.subset(font)
        font.save(output)
    version = hashlib.sha256(output.read_bytes()).hexdigest()[:12]
    # More specific title and introduction ranges follow the general Han face.
    ranges = "U+3400-9FFF" if name == "details" else unicode_ranges(chars)
    rules.append(f'    @font-face {{ font-family: "Huiwen Lobby"; '
                 f'src: url("./assets/fonts/{output.name}?v={version}") format("woff2"); '
                 f'font-display: swap; unicode-range: {ranges}; }}')

html = page.read_bytes().decode("utf-8")
newline = "\r\n" if "\r\n" in html else "\n"
html, matches = re.subn(r"(?:    @font-face \{[^\r\n]+\}\r?\n)+",
                        newline.join(rules) + newline, html)
if matches != 1:
    raise ValueError("Expected one group of font faces in games.html")
page.write_bytes(html.encode("utf-8"))
