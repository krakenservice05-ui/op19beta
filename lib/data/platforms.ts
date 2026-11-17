import { Platform } from "@/types";

// Exactly 8 platforms matching the confirmed card designs
export const PLATFORMS: Platform[] = [
  {
    id: "steam",
    name: "Steam",
    slug: "steam",
    icon: "/images/platform-art/steam.svg",
    color: "#1b5a7a",
    // Dark teal-to-blue gradient matching the reference card
    gradient: "linear-gradient(135deg, #1a4a6e 0%, #1b6fa0 50%, #0d3a5a 100%)",
    logoInvert: false,
  },
  {
    id: "xbox",
    name: "Xbox",
    slug: "xbox",
    icon: "/images/platform-art/xbox.svg",
    color: "#107c10",
    // Solid Xbox green
    gradient: "linear-gradient(135deg, #107c10 0%, #138a13 50%, #0a5e0a 100%)",
    logoInvert: false,
  },
  {
    id: "playstation",
    name: "PlayStation",
    slug: "playstation",
    icon: "/images/platform-art/playstation.svg",
    color: "#0070cc",
    // PlayStation blue
    gradient: "linear-gradient(135deg, #0057b8 0%, #0070d6 50%, #003d8c 100%)",
    logoInvert: false,
  },
  {
    id: "nintendo",
    name: "Nintendo",
    slug: "nintendo",
    icon: "/images/platform-art/nintendo.svg",
    color: "#e4000f",
    // Nintendo red
    gradient: "linear-gradient(135deg, #cc0000 0%, #e8001a 50%, #9e0000 100%)",
    logoInvert: false,
  },
  {
    id: "gog",
    name: "GOG",
    slug: "gog",
    icon: "/images/platform-art/gog.svg",
    color: "#5614c8",
    // GOG deep purple
    gradient: "linear-gradient(135deg, #4a0fb8 0%, #6b2de8 50%, #360b8e 100%)",
    logoInvert: false,
  },
  {
    id: "rockstar",
    name: "Rockstar",
    slug: "rockstar",
    icon: "/images/platform-art/rockstar.svg",
    color: "#2d2060",
    // Rockstar dark blue-to-purple gradient (matching reference screenshot exactly)
    gradient: "linear-gradient(135deg, #1a1a4e 0%, #2d1f6e 40%, #8b1a6b 100%)",
    logoInvert: false,
  },
  {
    id: "epic",
    name: "Epic Games",
    slug: "epic-games",
    icon: "/images/platform-art/epic.svg",
    color: "#1a1a6e",
    // Epic dark navy blue
    gradient: "linear-gradient(135deg, #151560 0%, #1e1e88 50%, #0e0e48 100%)",
    logoInvert: false,
  },
  {
    id: "ea-play",
    name: "EA Play",
    slug: "ea-play",
    icon: "/images/platform-art/ea-play.svg",
    color: "#e63c1e",
    // EA Play red/coral
    gradient: "linear-gradient(135deg, #d63010 0%, #f04420 50%, #b82808 100%)",
    logoInvert: false,
  },
];
