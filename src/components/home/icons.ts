import type { IconType } from "react-icons";
import { MdEmojiEvents, MdRedeem, MdStar } from "react-icons/md";
import type { RewardIcon } from "@/data/home";

export const REWARD_ICONS: Record<RewardIcon, IconType> = {
  star: MdStar,
  gift: MdRedeem,
  trophy: MdEmojiEvents,
};
