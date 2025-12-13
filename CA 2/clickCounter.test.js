import { incrementClicks } from "./gamelogic.js";

test("incrementClicks increases the click count by 1", () => {
    expect(incrementClicks(0)).toBe(1);
    expect(incrementClicks(5)).toBe(6);
    expect(incrementClicks(12)).toBe(13);
});
