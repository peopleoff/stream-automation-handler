/**
 * TikTok Gift Types
 * Common gifts sent during TikTok Live streams with their IDs
 */

export interface TikTokGift {
  id: string;
  name: string;
  coins: number;
  description: string;
}

/**
 * Common TikTok Live gifts
 * Gift IDs may vary by region and over time
 */
export const TIKTOK_GIFTS: TikTokGift[] = [
  {
    id: "5655",
    name: "Rose",
    coins: 1,
    description: "A single rose (1 coin)",
  },
  {
    id: "5269",
    name: "Panda",
    coins: 5,
    description: "Cute panda (5 coins)",
  },
  {
    id: "5827",
    name: "Finger Heart",
    coins: 5,
    description: "Heart gesture (5 coins)",
  },
  {
    id: "5658",
    name: "Perfume",
    coins: 20,
    description: "Luxury perfume (20 coins)",
  },
  {
    id: "5760",
    name: "Swan",
    coins: 99,
    description: "Elegant swan (99 coins)",
  },
  {
    id: "5739",
    name: "Drama Queen",
    coins: 299,
    description: "Drama queen gift (299 coins)",
  },
  {
    id: "6427",
    name: "Galaxy",
    coins: 1000,
    description: "Stunning galaxy effect (1000 coins)",
  },
  {
    id: "5817",
    name: "Lion",
    coins: 29999,
    description: "Majestic lion (29,999 coins)",
  },
  {
    id: "6064",
    name: "TikTok Universe",
    coins: 44999,
    description: "Ultimate universe gift (44,999 coins)",
  },
];

/**
 * Get gift by ID
 */
export function getGiftById(id: string): TikTokGift | undefined {
  return TIKTOK_GIFTS.find(gift => gift.id === id);
}

/**
 * Get gift by name
 */
export function getGiftByName(name: string): TikTokGift | undefined {
  return TIKTOK_GIFTS.find(gift => gift.name.toLowerCase() === name.toLowerCase());
}
