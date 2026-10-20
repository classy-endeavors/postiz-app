export const MONTHLY_COINS = 100;
export const COIN_COSTS = {
  message: 1,
  image: 5,
  post: 2,
  reply: 1,
};
export type CoinAction = keyof typeof COIN_COSTS;
