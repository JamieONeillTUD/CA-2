import { cardsMatch } from "./gamelogic.js";

test("cardsMatch returns true when type and colour match", () => {
    const cardA = { type: "circle", colour: "red" };
    const cardB = { type: "circle", colour: "red" };

    expect(cardsMatch(cardA, cardB)).toBe(true);
});

test("cardsMatch returns false when type OR colour do not match", () => {
    const wrongType = { type: "square", colour: "red" };
    const wrongColour = { type: "circle", colour: "blue" };

    const base = { type: "circle", colour: "red" };

    expect(cardsMatch(base, wrongType)).toBe(false);
    expect(cardsMatch(base, wrongColour)).toBe(false);
});