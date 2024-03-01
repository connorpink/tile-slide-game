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
  }

  componentDidUpdate() {
    localStorage.setItem("gameState", JSON.stringify(this.state));
  }
  componentDidMount() {
    window.addEventListener("keydown", this.handleKeyDown);
  }
  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }
  handleKeyDown = (e) => {
    const { tiles } = this.state;
    const emptyIndex = tiles.indexOf("");
    let targetIndex;

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

    if (targetIndex >= 0 && targetIndex < 16) {
      this.swapTiles(targetIndex);
    }
  };

  shuffleTiles(tiles) {
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    return tiles;
  }

  swapTiles = (i) => {
    if (!this.state.win) {
      const tiles = [...this.state.tiles];
      const emptyIndex = tiles.indexOf("");
      const distance = Math.abs(emptyIndex - i);

      if (distance === 1 || distance === 4) {
        [tiles[i], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[i]];
        this.setState({ tiles }, () => {
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
          this.checkWin();
        });
      }
    }
  };

  checkWin() {
    if (this.state.tiles.join(",") === "0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,") {
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

  resetGame = () => {
    clearInterval(this.interval);
    this.setState({
      tiles: this.shuffleTiles([...Array(15).keys(), ""]),
      win: false,
      startTime: null,
      endTime: null,
      gameTime: 0,
    });
  };

  resetHighScore = () => {
    this.setState({ highScore: null });
    const gameState = JSON.parse(localStorage.getItem("gameState"));
    gameState.highScore = null;
    localStorage.setItem("gameState", JSON.stringify(gameState));
  };

  setWinningState = () => {
    this.setState(
      {
        tiles: Array.from({ length: 15 }, (_, i) => i).concat(""),
      },
      this.checkWin
    );
  };

  render() {
    const { tiles, win, highScore } = this.state;

    return (
      <div className="App">
        <div className="gameRow">{win && <h2>You win!</h2>}</div>

        <div className="gameRow">
          <div className="gameColumn">
            <div className="gameRow time">
              <p>Current: {this.state.gameTime}</p>
              <p>Best: {highScore ? highScore : "?"}</p>
            </div>
            <div className="grid">
              {tiles.map((tile, i) => (
                <button
                  key={i}
                  onClick={() => this.swapTiles(i)}
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
        <button id="menuButton" onClick={this.setWinningState}>
          Set Winning State
        </button>
        <button id="menuButton" onClick={this.resetHighScore}>
          Reset High Score
        </button>
      </div>
    );
  }
}

export default App;
