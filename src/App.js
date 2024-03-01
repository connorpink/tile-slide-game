import React, { Component } from "react";
import "./App.css";

// Tile slide game
// 16 tiles in a 4 by 4 grid
// tiles should be represented by button elements
// the tiles have the numbers 1 through 15 on them.
// the 16th tile should be an empty space
// the tiles are in a random order
// clicking a tile next to the blank space (above, below, left, right of it) should shuffle that tile into the position of the blank, and the blank move to the location of the tile that was clicked.
// once the tiles are all in the order of {{1,2,3,4},{5,6,7,8},{9,10,11,12},{13,14,15,_}} then the game is complete.

class App extends Component {
  constructor() {
    super();
    // Initialize state from local storage if it exists, otherwise set default state
    const localState = JSON.parse(localStorage.getItem("gameState"));
    this.state = localState
      ? localState
      : {
          tiles: this.shuffleTiles([...Array(15).keys(), ""]),
          win: false,
          startTime: null,
          endTime: null,
          highScore: localState ? localState.highScore : null,
          gameTime: 0,
        };
    // If there's a startTime in the saved state, start the timer
    if (this.state.startTime) {
      this.startTimer();
    }
  }

  // Start the timer to keep track of game time
  startTimer() {
    this.interval = setInterval(() => {
      this.setState({
        gameTime: Math.floor((Date.now() - this.state.startTime) / 1000),
      });
    }, 1000);
  }

  // Format time from seconds to minutes and seconds
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    // Pad the seconds with a 0 if it's less than 10
    const paddedSeconds =
      remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;
    return `${minutes}:${paddedSeconds}`;
  }

  // Save the current game state to local storage whenever it updates
  componentDidUpdate() {
    localStorage.setItem("gameState", JSON.stringify(this.state));
  }

  // Add event listener for keyboard input when the component mounts
  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  // Remove the event listener when the component unmounts to prevent memory leaks
  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  // Handle keyboard input to move tiles
  handleKeyDown = (e) => {
    const { tiles } = this.state;
    const emptyIndex = tiles.indexOf("");
    let targetIndex;

    // Determine which tile to move based on the arrow key pressed
    switch (e.key) {
      case "ArrowLeft":
        // Prevent the empty tile from moving to the right when it's on the right edge
        if (emptyIndex % 4 === 3) return;
        targetIndex = emptyIndex + 1;
        break;
      case "ArrowRight":
        // Prevent the empty tile from moving to the left when it's on the left edge
        if (emptyIndex % 4 === 0) return;
        targetIndex = emptyIndex - 1;
        break;
      case "ArrowUp":
        targetIndex = emptyIndex + 4;
        break;
      case "ArrowDown":
        targetIndex = emptyIndex - 4;
        break;
      default:
        return;
    }

    // Move the tile if the target index is within the grid
    if (targetIndex >= 0 && targetIndex < 16) {
      this.swapTiles(targetIndex);
    }
  };

  // Shuffles the tiles array until it meets the conditions for solvability.
  shuffleTiles(tiles) {
    let shuffledTiles;
    let inversionCount;
    let blankRowFromTop;

    do {
      shuffledTiles = [...tiles];
      for (let i = shuffledTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTiles[i], shuffledTiles[j]] = [
          shuffledTiles[j],
          shuffledTiles[i],
        ];
      }

      inversionCount = 0;
      for (let i = 0; i < shuffledTiles.length; i++) {
        if (shuffledTiles[i] === "") continue;
        for (let j = i + 1; j < shuffledTiles.length; j++) {
          if (shuffledTiles[j] !== "" && shuffledTiles[i] > shuffledTiles[j]) {
            inversionCount++;
          }
        }
      }

      // Calculate the row of the blank tile from the top (1-indexed)
      blankRowFromTop = Math.floor(shuffledTiles.indexOf("") / 4) + 1;

      // The parity of the inversion count and the blank row from the top must be the same
    } while (blankRowFromTop % 2 !== inversionCount % 2);

    return shuffledTiles;
  }

  // Swap a tile with the empty space
  swapTiles = (i) => {
    // If the game is already won, no need to swap tiles
    if (!this.state.win) {
      const tiles = [...this.state.tiles];
      // Find the index of the empty tile
      const emptyIndex = tiles.indexOf("");
      // Calculate the distance between the clicked tile and the empty tile
      const distance = Math.abs(emptyIndex - i);
      // Only swap if the tile is adjacent to the empty space
      if (distance === 1 || distance === 4) {
        // Swap the clicked tile and the empty tile
        [tiles[i], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[i]];
        // Update the state with the new tiles
        this.setState({ tiles }, () => {
          // Start the timer when the first move is made
          if (!this.state.startTime) {
            const startTime = Date.now();
            this.setState({ startTime });
            this.interval = setInterval(() => {
              this.setState({
                gameTime: Math.floor(
                  (Date.now() - this.state.startTime) / 1000
                ),
              });
            }, 1000);
          }
          // Check if the game is won after each move
          this.checkWin();
        });
      }
    }
  };
  // Check if the current state of the tiles is the winning state
  checkWin() {
    // If the tiles are in the correct order, the game is won
    if (this.state.tiles.join(",") === "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,") {
      // Stop the timer
      clearInterval(this.interval);
      const { startTime, highScore } = this.state;
      if (startTime) {
        const endTime = Date.now();
        const gameTime = Math.floor((endTime - startTime) / 1000);
        if (highScore === null || gameTime < highScore) {
          this.setState({ win: true, endTime, highScore: gameTime });
          localStorage.setItem("gameState", JSON.stringify(this.state));
        } else {
          this.setState({ win: true, endTime });
        }
      } else {
        this.setState({ win: true });
      }
    }
  }

  // Reset the game to the initial state
  resetGame = () => {
    // Stop the timer
    clearInterval(this.interval);
    // Reset the state
    this.setState({
      tiles: this.shuffleTiles([...Array(15).keys(), ""]),
      win: false,
      startTime: null,
      endTime: null,
      gameTime: 0,
    });
  };
  // Reset the high score
  resetHighScore = () => {
    // Set the high score in the state to null
    this.setState({ highScore: null });
    // Update the high score in local storage
    const gameState = JSON.parse(localStorage.getItem("gameState"));
    gameState.highScore = null;
    localStorage.setItem("gameState", JSON.stringify(gameState));
  };

  // Set the state to the winning state
  setWinningState = () => {
    // Set the tiles in the correct order and check if the game is won
    this.setState(
      {
        tiles: Array.from({ length: 15 }, (_, i) => i).concat(""),
      },
      this.checkWin
    );
  };

  render() {
    const { tiles, win, highScore, gameTime } = this.state;

    return (
      <div className="App">
        <div className="gameRow">{win && <h2>You win!</h2>}</div>

        <div className="gameRow">
          <div className="gameColumn">
            <div className="gameRow time">
              <p>Current: {this.formatTime(gameTime)}</p>
              <p>Best: {highScore ? this.formatTime(highScore) : "?"}</p>
            </div>
            <div className="grid">
              {tiles.map((tile, i) => (
                <button
                  id={`tile-${i}`}
                  key={i}
                  onClick={() => this.swapTiles(i)}
                  // class is either square or empty depending on the tile number
                  className={tile === "" ? "empty" : "square"}
                >
                  {tile !== "" ? tile + 1 : ""}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button id="menuButton" onClick={this.resetGame}>
          Reset Board
        </button>
        {/*
        <button id="menuButton" onClick={this.setWinningState}>
          Set Winning State
        </button>
        <button id="menuButton" onClick={this.resetHighScore}>
          Reset High Score
        </button>
              */}
      </div>
    );
  }
}

export default App;
