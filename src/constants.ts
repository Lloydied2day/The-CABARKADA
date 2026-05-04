import { 
  Trophy, 
  Music, 
  BookOpen, 
  HandHelping, 
  PartyPopper,
  Palette,
  Mic2,
  PenTool,
  Scissors,
  Theater,
  Languages
} from "lucide-react";

export const CATEGORIES = [
  { id: "education", name: "Education", icon: BookOpen },
  { id: "sports", name: "Sports", icon: Trophy },
  { id: "arts", name: "Arts", icon: Palette },
  { id: "music", name: "Music", icon: Music },
  { id: "acting", name: "Acting", icon: Theater },
  { id: "speech", name: "Speech", icon: Mic2 },
  { id: "writing", name: "Writing", icon: PenTool },
  { id: "pottery", name: "Pottery", icon: Scissors }, // Using Scissors as placeholder for pottery/craft
  { id: "crochet", name: "Crochet", icon: Scissors },
  { id: "volunteer", name: "Volunteer", icon: HandHelping },
  { id: "social", name: "Social", icon: PartyPopper },
];
