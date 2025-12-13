// Testing 
// returns true if two cards match
export function cardsMatch(cardA, cardB) {
    return (
        cardA.type === cardB.type &&
        cardA.colour === cardB.colour
    );
}

// returns updated click count
export function incrementClicks(current) {
    return current + 1;
}