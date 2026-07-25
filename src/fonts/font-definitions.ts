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
  | "yellowtail"
  | "edu-nsw-act-foundation"
  | "edu-vic-wa-nt-hand"
  | "league-script"
  | "playwrite-be-vlg-guides"
  | "playwrite-ca"
  | "playwrite-de-grund-guides"
  | "playwrite-id"
  | "playwrite-mx"
  | "playwrite-nz-basic"
  | "playwrite-nz-basic-guides"
  | "playwrite-nz-guides"
  | "playwrite-pt"
  | "playwrite-ro-guides"
  | "playwrite-us-trad";

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
    "edu-nsw-act-foundation",
    "Edu NSW ACT Foundation",
    "edu-nsw-act-foundation/EduNSWACTFoundation-Regular.ttf",
    "The AU School Handwriting Fonts Project Authors",
  ),
  font(
    "edu-vic-wa-nt-hand",
    "Edu VIC WA NT Hand",
    "edu-vic-wa-nt-hand/EduVICWANTHand-Regular.ttf",
    "The VIC WA NT School Hand Australia Project Authors",
  ),
  font(
    "league-script",
    "League Script",
    "league-script/LeagueScript-Regular.ttf",
    "Haley Fiege",
  ),
  font(
    "playwrite-be-vlg-guides",
    "Playwrite BE VLG Guides",
    "playwrite-be-vlg-guides/PlaywriteBEVLGGuides-Regular.ttf",
    "The Playwrite Project Authors",
  ),
  font(
    "playwrite-ca",
    "Playwrite CA ExtraLight",
    "playwrite-ca/PlaywriteCA-ExtraLight.ttf",
    "The Playwrite Project Authors",
  ),
  font(
    "playwrite-de-grund-guides",
    "Playwrite DE Grund Guides",
    "playwrite-de-grund-guides/PlaywriteDEGrundGuides-Regular.ttf",
    "The Playwrite Project Authors",
  ),
  font(
    "playwrite-id",
    "Playwrite ID ExtraLight",
    "playwrite-id/PlaywriteID-ExtraLight.ttf",
    "The Playwrite Project Authors",
  ),
  font(
    "playwrite-mx",
    "Playwrite MX ExtraLight",
    "playwrite-mx/PlaywriteMX-ExtraLight.ttf",
    "The Playwrite Project Authors",
  ),
  font(
    "playwrite-nz-basic",
    "Playwrite NZ Basic ExtraLight",
    "playwrite-nz-basic/PlaywriteNZBasic-ExtraLight.ttf",
    "The Playwrite Project Authors",
  ),
  font(
    "playwrite-nz-basic-guides",
    "Playwrite NZ Basic Guides",
    "playwrite-nz-basic-guides/PlaywriteNZBasicGuides-Regular.ttf",
    "The Playwrite Project Authors",
  ),
  font(
    "playwrite-nz-guides",
    "Playwrite NZ Guides",
    "playwrite-nz-guides/PlaywriteNZGuides-Regular.ttf",
    "The Playwrite Project Authors",
  ),
  font(
    "playwrite-pt",
    "Playwrite PT ExtraLight",
    "playwrite-pt/PlaywritePT-ExtraLight.ttf",
    "The Playwrite Project Authors",
  ),
  font(
    "playwrite-ro-guides",
    "Playwrite RO Guides",
    "playwrite-ro-guides/PlaywriteROGuides-Regular.ttf",
    "The Playwrite Project Authors",
  ),
  font(
    "playwrite-us-trad",
    "Playwrite US Trad ExtraLight",
    "playwrite-us-trad/PlaywriteUSTrad-ExtraLight.ttf",
    "The Playwrite Project Authors",
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
