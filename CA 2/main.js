/*
Student Number: C22320301
Student Name: Jamie O'Neill
Course Code: TU857/4
Date: 30/11/2025
Description:

JavaScript - CMPU4043 Rich Web Development CA2 Assignment – Shape Memory Game

This is the main JavaScript file that contains the logic for the shape matching memory game.
It connects to Firebase Firestore to store and retrieve game results.
And it defines the custom element <shape-game> that manages the game state and user interactions.
It also imports the ShapeCard class from shapecard.js to create and manage individual shape cards.
*/

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { ShapeCard } from "./shapecard.js";

// Firebase setup information
const firebaseConfig = {
    apiKey: "AIzaSyCPR0_bbggHsUm5xWkkGpJmFlPQZT-WM2c",
    authDomain: "ca2-memory-game.firebaseapp.com",
    projectId: "ca2-memory-game",
    storageBucket: "ca2-memory-game.firebasestorage.app",
    messagingSenderId: "357123542798",
    appId: "1:357123542798:web:0b140e8ffb180824bb515f"
};

// Connect to Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Connect to Firestore database
const database = getFirestore(firebaseApp);

// DB collection for storing results
const resultsCollection = collection(database, "gameResults");

// update click counter text
function updateClickCounter(newValue) {
    const counterElement = document.getElementById("clickCounter");
    if (counterElement) {
        counterElement.innerText = "Total Amount Of Clicks: " + newValue;
    }
}

// reset the average score display box
function resetAverageScoreBox() {
    const averageBox = document.getElementById("avgScoreBox");
    const averageText = document.getElementById("avgResult");
    if (averageBox && averageText) {
        averageBox.style.display = "none";
        averageText.innerText = "Average Score: --";
    }
}

// shows the popup and writes the score into it
function showWinPopup(clicks) {
    document.getElementById("winPopupMessage").innerText =
        "You completed the game in " + clicks + " clicks!";
    document.getElementById("winPopupOverlay").style.display = "flex";
}

// closes the popup when the OK button is pressed
document.getElementById("winPopupOkBtn").addEventListener("click", () => {
    document.getElementById("winPopupOverlay").style.display = "none";
});

// restarts the game when the Play Again button is pressed
document.getElementById("winPopupPlayAgainBtn").addEventListener("click", () => {
    document.getElementById("winPopupOverlay").style.display = "none";
    document.querySelector("shape-game").buildGameBoard();
    updateClickCounter(0);
    resetAverageScoreBox();
});

// Custom game element that holds the memory game logic
class ShapeGame extends HTMLElement {

    constructor() {
        super();
        // create shadow DOM for the element
        this.attachShadow({ mode: "open" });     

        this.firstSelectedCard = null;          
        this.secondSelectedCard = null;          
        this.totalClicks = 0;                   
    }

    connectedCallback() {
        // build the game when added to page
        this.buildGameBoard();                   
    }

    // Create the grid of cards for the game
    buildGameBoard() {

        // clear previous game
        this.shadowRoot.innerHTML = "";        

        const boardSize = this.getAttribute("size") || "3x4";
        const splitSize = boardSize.split("x");
        const rowCount = parseInt(splitSize[0]);
        const columnCount = parseInt(splitSize[1]);

        // the wrapper for the game board
        const boardWrapper = document.createElement("div");
        boardWrapper.style.display = "grid";
        boardWrapper.style.gridTemplateColumns = `repeat(${columnCount}, 110px)`;
        boardWrapper.style.gap = "12px";
        boardWrapper.style.padding = "10px";

        // pair of cards needed
        const numberOfPairs = (rowCount * columnCount) / 2;

        // generates HTML for all cards
        boardWrapper.innerHTML = ShapeCard.getUniqueRandomCardsAsHTML(numberOfPairs, true);

        // add click events to every card
        boardWrapper.querySelectorAll("shape-card").forEach(cardElement => {
            cardElement.addEventListener("click", () => this.handleCardFlip(cardElement));
        });

        // add the board to the shadow DOM
        this.shadowRoot.append(boardWrapper);

        // reset game values
        this.firstSelectedCard = null;
        this.secondSelectedCard = null;
        this.totalClicks = 0;
        updateClickCounter(0);   // reset shown counter
    }

    // When the player clicks a card this function runs
    handleCardFlip(cardElement) {

        // ignore clicks on cards that are already faceup
        if (cardElement.isFaceUp()) return;

        // ignore if they have already clicked two cards
        if (this.secondSelectedCard) return;

        this.totalClicks++;     
        updateClickCounter(this.totalClicks);  // update counter

        cardElement.flip();     

        // save the first card clicked
        if (!this.firstSelectedCard) {
            this.firstSelectedCard = cardElement;
            return;
        }

        // save the second card clicked
        this.secondSelectedCard = cardElement;

        // check if the cards match
        const isMatch =
            this.firstSelectedCard.getAttribute("type") === this.secondSelectedCard.getAttribute("type") &&
            this.firstSelectedCard.getAttribute("colour") === this.secondSelectedCard.getAttribute("colour");

        // if the two cards match
        if (isMatch) {

            // highlight the front side of both matched cards
            const firstFront = this.firstSelectedCard.shadowRoot.querySelector(".card-front");
            const secondFront = this.secondSelectedCard.shadowRoot.querySelector(".card-front");

            if (firstFront && secondFront) {
                // light green background and green border
                firstFront.style.backgroundColor = "#b2f5b4";   
                secondFront.style.backgroundColor = "#b2f5b4";

                firstFront.style.outline = "3px solid #22c55e"; 
                secondFront.style.outline = "3px solid #22c55e";

                firstFront.style.borderRadius = "12px";
                secondFront.style.borderRadius = "12px";
            }

            // reset for next turn
            this.firstSelectedCard = null;
            this.secondSelectedCard = null;

            // see if the whole game is now finished
            this.checkIfGameIsFinished();

        // if the two cards do not match
        } else {

            // flip them back after a short delay
            setTimeout(() => {
                this.firstSelectedCard.flip();
                this.secondSelectedCard.flip();

                this.firstSelectedCard = null;
                this.secondSelectedCard = null;

            }, 700);
        }
    }

    // see if all cards are matched and the game is finished
    async checkIfGameIsFinished() {

        const allCards = Array.from(this.shadowRoot.querySelectorAll("shape-card"));
        const allCardsFaceUp = allCards.every(card => card.isFaceUp());

        // if all cards matched, the game is done
        if (allCardsFaceUp) {

            // save the score in Firestore
            await addDoc(resultsCollection, {
                clicks: this.totalClicks,
                timestamp: new Date().toISOString()
            });

            // replaced alert with popup
            showWinPopup(this.totalClicks);

            updateClickCounter(0);  // reset counter after game
        }
    }
}

// register the custom element
customElements.define("shape-game", ShapeGame);

// When the reset button is clicked it resets the game
document.getElementById("resetGameBtn").addEventListener("click", () => {
    const gameElement = document.querySelector("shape-game");
    gameElement.buildGameBoard();
    updateClickCounter(0);   // reset counter
    resetAverageScoreBox();
});

// When the average score button is clicked it shows average clicks
document.getElementById("showAvgBtn").addEventListener("click", async () => {

    const resultsSnapshot = await getDocs(resultsCollection);
    const clickValues = resultsSnapshot.docs.map(document => document.data().clicks);

    // no games recorded yet
    if (clickValues.length === 0) {
        document.getElementById("avgResult").innerText = "No games recorded yet.";
        //Show  average score box
        document.getElementById("avgScoreBox").style.display = "block";
        return;
    }

    // calculate average clicks
    let totalClicks = 0;
    clickValues.forEach(value => totalClicks += value);

    const averageClicks = totalClicks / clickValues.length;

    // update text
    document.getElementById("avgResult").innerText =
        `Average Score: ${averageClicks.toFixed(1)} clicks`;

    // show blue box
    document.getElementById("avgScoreBox").style.display = "block";

});
