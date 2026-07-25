export type BuiltInFontId =
  | "patrick-hand"
  | "architects-daughter"
  | "allura"
  | "amita"
  | "arizonia"
  | "bad-script"
  | "charm"
  | "chilanka"
  | "corinthia"
  | "damion"
  | "dancing-script"
  | "delius"
  | "italianno"
  | "niconne"
  | "pangolin"
  | "rochester"
  | "sacramento"
  | "satisfy"
  | "yellowtail";

export interface BuiltInFontDefinition {
  readonly id: BuiltInFontId;
  readonly familyName: string;
  readonly url: string;
  readonly attribution: string;
}

export const BUILT_IN_FONTS: readonly BuiltInFontDefinition[] = [
  font(
    "patrick-hand",
    "Patrick Hand",
    "patrick-hand/PatrickHand-Regular.ttf",
    "Patrick Wagesreiter",
  ),
  font(
    "architects-daughter",
    "Architects Daughter",
    "architects-daughter/ArchitectsDaughter-Regular.ttf",
    "Kimberly Geswein",
  ),
  font(
    "allura",
    "Allura",
    "allura/Allura-Regular.ttf",
    "The Allura Project Authors",
  ),
  font(
    "amita",
    "Amita",
    "amita/Amita-Regular.ttf",
    "Eduardo Rodriguez Tunni and contributors",
  ),
  font("arizonia", "Arizonia", "arizonia/Arizonia-Regular.ttf", "TypeSETit"),
  font(
    "bad-script",
    "Bad Script",
    "bad-script/BadScript-Regular.ttf",
    "Cyreal",
  ),
  font(
    "charm",
    "Charm",
    "charm/Charm-Regular.ttf",
    "The Charm Project Authors",
  ),
  font(
    "chilanka",
    "Chilanka",
    "chilanka/Chilanka-Regular.ttf",
    "The Chilanka Project Authors",
  ),
  font(
    "corinthia",
    "Corinthia",
    "corinthia/Corinthia-Regular.ttf",
    "The Corinthia Project Authors",
  ),
  font("damion", "Damion", "damion/Damion-Regular.ttf", "Vernon Adams"),
  font(
    "dancing-script",
    "Dancing Script",
    "dancing-script/DancingScript-Regular.ttf",
    "The Dancing Script Project Authors",
  ),
  font("delius", "Delius", "delius/Delius-Regular.ttf", "Natalia Raices"),
  font(
    "italianno",
    "Italianno",
    "italianno/Italianno-Regular.ttf",
    "The Italianno Project Authors",
  ),
  font("niconne", "Niconne", "niconne/Niconne-Regular.ttf", "Vernon Adams"),
  font(
    "pangolin",
    "Pangolin",
    "pangolin/Pangolin-Regular.ttf",
    "The Pangolin Project Authors",
  ),
  font(
    "rochester",
    "Rochester",
    "rochester/Rochester-Regular.ttf",
    "Font Diner",
  ),
  font(
    "sacramento",
    "Sacramento",
    "sacramento/Sacramento-Regular.ttf",
    "Brian J. Bonislawsky",
  ),
  font("satisfy", "Satisfy", "satisfy/Satisfy-Regular.ttf", "Font Diner"),
  font(
    "yellowtail",
    "Yellowtail",
    "yellowtail/Yellowtail-Regular.ttf",
    "Brian J. Bonislawsky",
  ),
];

function font(
  id: BuiltInFontId,
  familyName: string,
  relativePath: string,
  attribution: string,
): BuiltInFontDefinition {
  return {
    id,
    familyName,
    url: `/fonts/${relativePath}`,
    attribution,
  };
}
