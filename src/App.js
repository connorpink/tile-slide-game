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
          solving: false,
          solutionStats: null,
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
      solving: false,
      solutionStats: null,
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

  // Manhattan distance heuristic for A*
  manhattanDistance = (tiles) => {
    let distance = 0;
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] !== "") {
        const value = tiles[i];
        const currentRow = Math.floor(i / 4);
        const currentCol = i % 4;
        const targetRow = Math.floor(value / 4);
        const targetCol = value % 4;
        distance += Math.abs(currentRow - targetRow) + Math.abs(currentCol - targetCol);
      }
    }
    return distance;
  };

  // Get possible moves from current state
  getNeighbors = (tiles) => {
    const neighbors = [];
    const emptyIndex = tiles.indexOf("");
    const row = Math.floor(emptyIndex / 4);
    const col = emptyIndex % 4;

    // Define possible moves: up, down, left, right
    const moves = [
      { dr: -1, dc: 0 }, // up
      { dr: 1, dc: 0 },  // down
      { dr: 0, dc: -1 }, // left
      { dr: 0, dc: 1 }   // right
    ];

    moves.forEach(({ dr, dc }) => {
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 4) {
        const newIndex = newRow * 4 + newCol;
        const newTiles = [...tiles];
        [newTiles[emptyIndex], newTiles[newIndex]] = [newTiles[newIndex], newTiles[emptyIndex]];
        neighbors.push({ tiles: newTiles, move: newIndex });
      }
    });

    return neighbors;
  };

  // Beam search solver - fast and practical for sliding puzzles
  solvePuzzle = async () => {
    if (this.state.solving || this.state.win) return;

    this.setState({ solving: true, solutionStats: null });
    const startTime = performance.now();

    try {
      const targetString = Array.from({ length: 15 }, (_, i) => i).concat("").join(",");

      if (this.state.tiles.join(",") === targetString) {
        this.setState({ solving: false });
        return;
      }

      console.log("Starting Beam Search solver...");

      // Use beam search - keeps only the best N candidates at each level
      const result = await this.beamSearchSolve(this.state.tiles, targetString);

      if (result.found) {
        const endTime = performance.now();
        const solutionStats = {
          moves: result.path.length,
          nodesExplored: result.nodesExplored,
          timeTaken: Math.round(endTime - startTime)
        };

        console.log("Solution found!", solutionStats);
        await this.executeSolution(result.path, solutionStats);
      } else {
        console.log("No solution found - trying fallback approach");
        // Fallback to simple heuristic solver
        const fallbackResult = await this.greedySolve(this.state.tiles, targetString);

        if (fallbackResult.found) {
          const endTime = performance.now();
          const solutionStats = {
            moves: fallbackResult.path.length,
            nodesExplored: fallbackResult.nodesExplored,
            timeTaken: Math.round(endTime - startTime),
            note: "Non-optimal solution"
          };

          console.log("Fallback solution found!", solutionStats);
          await this.executeSolution(fallbackResult.path, solutionStats);
        } else {
          this.setState({ solving: false });
        }
      }

    } catch (error) {
      console.error("Error in solver:", error);
      this.setState({ solving: false });
    }
  };

  // Beam search with limited candidates per depth level
  beamSearchSolve = async (startTiles, targetString) => {
    let currentBeam = [{
      tiles: startTiles,
      path: [],
      depth: 0,
      heuristic: this.manhattanDistance(startTiles)
    }];

    const visited = new Set();
    visited.add(startTiles.join(","));

    let nodesExplored = 0;
    const beamWidth = 100; // Keep top 100 candidates
    const maxDepth = 100;

    for (let depth = 0; depth < maxDepth && currentBeam.length > 0; depth++) {
      console.log(`Depth ${depth}, beam size: ${currentBeam.length}`);

      let nextBeam = [];

      for (const current of currentBeam) {
        nodesExplored++;

        if (current.tiles.join(",") === targetString) {
          return { found: true, path: current.path, nodesExplored };
        }

        const neighbors = this.getNeighbors(current.tiles);

        for (const neighbor of neighbors) {
          const stateString = neighbor.tiles.join(",");

          if (!visited.has(stateString)) {
            visited.add(stateString);
            nextBeam.push({
              tiles: neighbor.tiles,
              path: [...current.path, neighbor.move],
              depth: current.depth + 1,
              heuristic: this.manhattanDistance(neighbor.tiles)
            });
          }
        }
      }

      // Keep only the best candidates (beam search)
      nextBeam.sort((a, b) => a.heuristic - b.heuristic);
      currentBeam = nextBeam.slice(0, beamWidth);

      // Yield control periodically
      if (depth % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return { found: false, nodesExplored };
  };

  // Simple greedy solver as fallback
  greedySolve = async (startTiles, targetString) => {
    let currentTiles = [...startTiles];
    let path = [];
    let nodesExplored = 0;
    const maxMoves = 500;

    console.log("Using greedy fallback solver...");

    while (path.length < maxMoves && currentTiles.join(",") !== targetString) {
      const neighbors = this.getNeighbors(currentTiles);

      // Find the neighbor that reduces Manhattan distance most
      let bestNeighbor = null;
      let bestHeuristic = Infinity;

      for (const neighbor of neighbors) {
        const h = this.manhattanDistance(neighbor.tiles);
        if (h < bestHeuristic) {
          bestHeuristic = h;
          bestNeighbor = neighbor;
        }
      }

      if (!bestNeighbor) break;

      currentTiles = bestNeighbor.tiles;
      path.push(bestNeighbor.move);
      nodesExplored++;

      // Yield control periodically
      if (nodesExplored % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    }

    return {
      found: currentTiles.join(",") === targetString,
      path,
      nodesExplored
    };
  };

  // Execute the solution moves with animation
  executeSolution = async (moves, stats) => {
    try {
      for (let i = 0; i < moves.length; i++) {
        if (!this.state.solving) break; // Allow cancellation
        await new Promise(resolve => setTimeout(resolve, 300));
        this.swapTiles(moves[i]);
      }

      this.setState({
        solving: false,
        solutionStats: stats
      });
    } catch (error) {
      console.error("Error executing solution:", error);
      this.setState({ solving: false });
    }
  };

  render() {
    const { tiles, win, highScore, gameTime, solving, solutionStats } = this.state;

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
        <button
          id="menuButton"
          onClick={this.solvePuzzle}
          disabled={solving || win}
        >
          {solving ? "Solving..." : "Auto Solve"}
        </button>
        {solutionStats && (
          <div className="solution-stats">
            <h3>Solution Complete!</h3>
            <p>Moves: {solutionStats.moves}</p>
            <p>Nodes Explored: {solutionStats.nodesExplored}</p>
            <p>Time: {solutionStats.timeTaken}ms</p>
            {solutionStats.note && <p style={{color: '#FFA500'}}>{solutionStats.note}</p>}
          </div>
        )}
        <button
          id="menuButton"
          onClick={() => {
            // Set to a nearly solved state for testing
            const testTiles = [0,1,2,3,4,5,6,7,8,9,10,11,13,14,"",12];
            this.setState({ tiles: testTiles, win: false, solutionStats: null });
          }}
        >
          Test State
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
