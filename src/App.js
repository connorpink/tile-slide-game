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

    const defaultState = {
      tiles: this.shuffleTiles([...Array(15).keys(), ""]),
      win: false,
      startTime: null,
      endTime: null,
      highScore: null,
      gameTime: 0,
      solving: false,
      solutionStats: null,
      selectedAlgorithm: "beam",
      comparisonMode: false,
      comparisonResults: [],
      currentProgress: null,
      progressStartTime: null,
    };

    // Merge local state with default state to ensure all properties exist
    this.state = localState
      ? {
          ...defaultState,
          ...localState,
          // Always reset these properties on load
          solving: false,
          solutionStats: null,
          selectedAlgorithm: localState.selectedAlgorithm || "beam",
          comparisonMode: false,
          comparisonResults: [],
          currentProgress: null,
          progressStartTime: null,
        }
      : defaultState;

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
      comparisonResults: [],
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
        distance +=
          Math.abs(currentRow - targetRow) + Math.abs(currentCol - targetCol);
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
      { dr: 1, dc: 0 }, // down
      { dr: 0, dc: -1 }, // left
      { dr: 0, dc: 1 }, // right
    ];

    moves.forEach(({ dr, dc }) => {
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow < 4 && newCol >= 0 && newCol < 4) {
        const newIndex = newRow * 4 + newCol;
        const newTiles = [...tiles];
        [newTiles[emptyIndex], newTiles[newIndex]] = [
          newTiles[newIndex],
          newTiles[emptyIndex],
        ];
        neighbors.push({ tiles: newTiles, move: newIndex });
      }
    });

    return neighbors;
  };

  // Main solve function that delegates to selected algorithm
  solvePuzzle = async () => {
    if (this.state.solving || this.state.win) return;

    if (this.state.comparisonMode) {
      await this.runAlgorithmComparison();
    } else {
      await this.runSingleAlgorithm(this.state.selectedAlgorithm);
    }
  };

  // Start progress tracking with timer
  startProgressTracking = (algorithmName, extraInfo = {}) => {
    const startTime = Date.now();
    this.setState({
      progressStartTime: startTime,
      currentProgress: {
        algorithm: algorithmName,
        nodesExplored: 0,
        elapsedTime: 0,
        ...extraInfo,
      },
    });

    // Update elapsed time every 100ms
    this.progressTimer = setInterval(() => {
      if (this.state.currentProgress && this.state.progressStartTime) {
        const elapsed = Date.now() - this.state.progressStartTime;
        this.setState({
          currentProgress: {
            ...this.state.currentProgress,
            elapsedTime: elapsed,
          },
        });
      }
    }, 100);
  };

  // Update progress during algorithm execution
  updateProgress = (algorithmName, nodesExplored, extraInfo = {}) => {
    if (this.state.currentProgress) {
      const elapsed = this.state.progressStartTime
        ? Date.now() - this.state.progressStartTime
        : 0;
      this.setState({
        currentProgress: {
          algorithm: algorithmName,
          nodesExplored,
          elapsedTime: elapsed,
          ...extraInfo,
        },
      });
    }
  };

  // Stop progress tracking
  stopProgressTracking = () => {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    this.setState({
      currentProgress: null,
      progressStartTime: null,
    });
  };

  // Run algorithm comparison on current board state
  runAlgorithmComparison = async () => {
    this.setState({
      solving: true,
      comparisonResults: [],
      currentProgress: null,
    });

    const algorithms = [
      { name: "Greedy", key: "greedy", timeout: 3000 },
      { name: "BFS", key: "bfs", timeout: 8000 },
      { name: "Weighted A*", key: "wastar", timeout: 20000 },
      { name: "Beam Search", key: "beam", timeout: 15000 },
      { name: "A*", key: "astar", timeout: 30000 },
      { name: "IDA*", key: "idastar", timeout: 45000 },
    ];

    console.log("🚀 Starting Algorithm Comparison");

    const results = [];
    const savedTiles = [...this.state.tiles];

    for (let i = 0; i < algorithms.length; i++) {
      const algo = algorithms[i];
      console.log(
        `\n--- Testing ${algo.name} (${i + 1}/${algorithms.length}) ---`
      );

      // Start progress tracking
      this.startProgressTracking(algo.name, {
        status: "starting",
        algorithmIndex: i + 1,
        totalAlgorithms: algorithms.length,
      });

      const result = await this.runAlgorithmWithTimeout(
        algo.key,
        algo.timeout,
        savedTiles
      );
      result.algorithm = algo.name;
      results.push(result);

      // Update progress to completed
      this.updateProgress(algo.name, result.nodesExplored, result.timeTaken, {
        status: result.success
          ? "completed"
          : result.timeout
          ? "timeout"
          : "failed",
        algorithmIndex: i + 1,
        totalAlgorithms: algorithms.length,
      });

      // Update UI with partial results
      this.setState({ comparisonResults: [...results] });

      // Brief pause between algorithms
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Sort by solution quality (moves, then time)
    results.sort((a, b) => {
      if (a.success && !b.success) return -1;
      if (!a.success && b.success) return 1;
      if (!a.success && !b.success) return 0;
      if (a.moves !== b.moves) return a.moves - b.moves;
      return a.timeTaken - b.timeTaken;
    });

    this.stopProgressTracking();
    this.setState({ solving: false, comparisonResults: results });
    console.log("🏆 Comparison Complete!", results);
  };

  // Run single algorithm
  runSingleAlgorithm = async (algorithmKey) => {
    this.setState({ solving: true, solutionStats: null });

    // Get algorithm name for display
    const algorithmNames = {
      greedy: "Greedy",
      bfs: "BFS",
      wastar: "Weighted A*",
      beam: "Beam Search",
      astar: "A*",
      idastar: "IDA*",
    };
    const algorithmName =
      algorithmNames[algorithmKey] || algorithmKey.toUpperCase();

    // Start progress tracking
    this.startProgressTracking(algorithmName, { status: "starting" });

    const result = await this.runAlgorithmWithTimeout(
      algorithmKey,
      60000,
      this.state.tiles
    );

    if (result?.success) {
      this.updateProgress(algorithmName, result.nodesExplored, {
        status: "solution_found",
      });
      await this.executeSolution(result.path || [], {
        moves: result.moves || 0,
        nodesExplored: result.nodesExplored || 0,
        timeTaken: result.timeTaken || 0,
        algorithm: algorithmName,
      });
      this.stopProgressTracking();
    } else {
      this.updateProgress(algorithmName, result.nodesExplored, {
        status: result.timeout ? "timeout" : "failed",
      });
      setTimeout(() => this.stopProgressTracking(), 2000); // Show final status for 2s
      this.setState({ solving: false });
    }
  };

  // Run algorithm with timeout handling
  runAlgorithmWithTimeout = async (algorithmKey, timeout, tiles) => {
    const startTime = performance.now();

    try {
      const targetString = Array.from({ length: 15 }, (_, i) => i)
        .concat("")
        .join(",");

      if (tiles.join(",") === targetString) {
        return {
          success: true,
          moves: 0,
          nodesExplored: 0,
          timeTaken: 0,
          path: [],
        };
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeout)
      );

      let algorithmPromise;
      switch (algorithmKey) {
        case "greedy":
          algorithmPromise = this.greedySolve(tiles, targetString);
          break;
        case "bfs":
          algorithmPromise = this.bfsSolve(tiles, targetString);
          break;
        case "beam":
          algorithmPromise = this.beamSearchSolve(tiles, targetString);
          break;
        case "wastar":
          algorithmPromise = this.weightedAStarSolve(tiles, targetString);
          break;
        case "astar":
          algorithmPromise = this.aStarSolve(tiles, targetString);
          break;
        case "idastar":
          algorithmPromise = this.idaStarSolve(tiles, targetString);
          break;
        default:
          algorithmPromise = this.beamSearchSolve(tiles, targetString);
      }

      const result = await Promise.race([algorithmPromise, timeoutPromise]);
      const timeTaken = Math.round(performance.now() - startTime);

      return {
        success: result?.found || false,
        moves: result?.path?.length || 0,
        nodesExplored: result?.nodesExplored || 0,
        timeTaken,
        path: result?.path || [],
        timeout: false,
      };
    } catch (error) {
      const timeTaken = Math.round(performance.now() - startTime);
      console.log(`Algorithm ${algorithmKey} failed:`, error.message);

      return {
        success: false,
        moves: 0,
        nodesExplored: 0,
        timeTaken,
        path: [],
        timeout: error.message === "timeout",
        error: error.message,
      };
    }
  };

  // Beam search with limited candidates per depth level
  beamSearchSolve = async (startTiles, targetString) => {
    let currentBeam = [
      {
        tiles: startTiles,
        path: [],
        depth: 0,
        heuristic: this.manhattanDistance(startTiles),
      },
    ];

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
              heuristic: this.manhattanDistance(neighbor.tiles),
            });
          }
        }
      }

      // Keep only the best candidates (beam search)
      nextBeam.sort((a, b) => a.heuristic - b.heuristic);
      currentBeam = nextBeam.slice(0, beamWidth);

      // Yield control periodically
      if (depth % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    return { found: false, nodesExplored };
  };

  // Hill-climbing greedy with restart - more practical for 15-puzzle
  greedySolve = async (startTiles, targetString) => {
    const maxRestarts = 5;
    const maxMovesPerRestart = 200;
    let bestResult = { found: false, path: [], nodesExplored: 0 };
    let totalNodesExplored = 0;

    console.log("Using hill-climbing greedy with restarts...");

    for (let restart = 0; restart < maxRestarts; restart++) {
      let currentTiles = [...startTiles];
      let path = [];
      let nodesExplored = 0;
      let stuckCount = 0;
      let lastHeuristic = this.manhattanDistance(startTiles);

      // Add some randomization after first attempt
      if (restart > 0) {
        // Make a few random moves to start from a different position
        for (let i = 0; i < restart * 3; i++) {
          const neighbors = this.getNeighbors(currentTiles);
          if (neighbors.length > 0) {
            const randomNeighbor =
              neighbors[Math.floor(Math.random() * neighbors.length)];
            currentTiles = randomNeighbor.tiles;
          }
        }
        lastHeuristic = this.manhattanDistance(currentTiles);
      }

      while (
        nodesExplored < maxMovesPerRestart &&
        currentTiles.join(",") !== targetString
      ) {
        const neighbors = this.getNeighbors(currentTiles);

        // Find best move with some randomness to escape local optima
        let bestNeighbor = null;
        let bestHeuristic = Infinity;
        const goodMoves = [];

        for (const neighbor of neighbors) {
          const h = this.manhattanDistance(neighbor.tiles);

          if (h < bestHeuristic) {
            bestHeuristic = h;
            bestNeighbor = neighbor;
          }

          // Collect moves that don't make things much worse
          if (h <= lastHeuristic + 1) {
            goodMoves.push({ neighbor, heuristic: h });
          }
        }

        // If stuck (no improvement), try a random good move
        if (bestHeuristic >= lastHeuristic) {
          stuckCount++;
          if (stuckCount > 3 && goodMoves.length > 0) {
            const randomGoodMove =
              goodMoves[Math.floor(Math.random() * goodMoves.length)];
            bestNeighbor = randomGoodMove.neighbor;
            bestHeuristic = randomGoodMove.heuristic;
            stuckCount = 0; // Reset stuck count
          } else if (stuckCount > 10) {
            break; // Give up this restart
          }
        } else {
          stuckCount = 0;
        }

        if (!bestNeighbor) break;

        currentTiles = bestNeighbor.tiles;
        path.push(bestNeighbor.move);
        nodesExplored++;
        lastHeuristic = bestHeuristic;

        // Early success
        if (currentTiles.join(",") === targetString) {
          console.log(
            `Greedy success on restart ${restart}: ${path.length} moves`
          );
          return {
            found: true,
            path,
            nodesExplored: totalNodesExplored + nodesExplored,
          };
        }

        // Yield control periodically
        if (nodesExplored % 20 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 2));
        }
      }

      totalNodesExplored += nodesExplored;

      // Keep track of best attempt
      if (
        lastHeuristic <
          this.manhattanDistance(bestResult.bestTiles || startTiles) ||
        path.length > bestResult.path.length
      ) {
        bestResult = {
          found: false,
          path: [...path],
          nodesExplored: totalNodesExplored,
          bestTiles: [...currentTiles],
          finalHeuristic: lastHeuristic,
        };
      }

      console.log(
        `Greedy restart ${restart}: ${nodesExplored} moves, final h=${lastHeuristic}`
      );
    }

    console.log(
      `Greedy failed after ${maxRestarts} restarts, best h=${bestResult.finalHeuristic}`
    );
    return {
      found: false,
      path: bestResult.path,
      nodesExplored: totalNodesExplored,
    };
  };

  // Improved BFS Algorithm with better limits
  bfsSolve = async (startTiles, targetString) => {
    const queue = [{ tiles: startTiles, path: [], depth: 0 }];
    const visited = new Set([startTiles.join(",")]);

    let nodesExplored = 0;
    const maxDepth = 30; // Increased depth limit
    const maxNodes = 500000; // Increased node limit
    const targetDepth = this.manhattanDistance(startTiles); // Use heuristic as guide

    console.log(`BFS starting with heuristic estimate: ${targetDepth}`);

    while (queue.length > 0 && nodesExplored < maxNodes) {
      const current = queue.shift();
      nodesExplored++;

      if (nodesExplored % 2500 === 0) {
        const elapsed = Date.now() - Date.now(); // Will fix this
        this.updateProgress?.("BFS", nodesExplored, elapsed, {
          status: "running",
          depth: current.depth,
          queueSize: queue.length,
        });
        await new Promise((resolve) => setTimeout(resolve, 10));
        console.log(
          `BFS: ${nodesExplored} nodes, depth ${current.depth}, queue size ${queue.length}`
        );
      }

      if (current.tiles.join(",") === targetString) {
        return { found: true, path: current.path, nodesExplored };
      }

      if (current.depth >= maxDepth) continue;

      const neighbors = this.getNeighbors(current.tiles);
      for (const neighbor of neighbors) {
        const stateString = neighbor.tiles.join(",");
        if (!visited.has(stateString)) {
          visited.add(stateString);
          queue.push({
            tiles: neighbor.tiles,
            path: [...current.path, neighbor.move],
            depth: current.depth + 1,
          });
        }
      }
    }

    console.log(
      `BFS failed: explored ${nodesExplored} nodes, max depth ${maxDepth}`
    );
    return { found: false, nodesExplored };
  };

  // Improved A* Algorithm with better performance
  aStarSolve = async (startTiles, targetString) => {
    const openSet = [
      {
        tiles: startTiles,
        g: 0,
        h: this.manhattanDistance(startTiles),
        f: 0,
        parent: null,
        move: null,
      },
    ];

    openSet[0].f = openSet[0].g + openSet[0].h;
    const closedSet = new Set();
    const visited = new Map([[startTiles.join(","), 0]]);

    let nodesExplored = 0;
    const maxIterations = 200000; // Increased limit
    const initialHeuristic = this.manhattanDistance(startTiles);

    console.log(`A* starting with initial heuristic: ${initialHeuristic}`);

    while (openSet.length > 0 && nodesExplored < maxIterations) {
      if (nodesExplored % 2000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        if (nodesExplored % 10000 === 0) {
          console.log(
            `A*: ${nodesExplored} nodes, open set size: ${openSet.length}`
          );
        }
      }

      // Use more efficient sorting - sort periodically instead of every iteration
      if (nodesExplored % 100 === 0) {
        openSet.sort((a, b) => a.f - b.f);
      }

      const current = openSet.shift();
      const currentString = current.tiles.join(",");

      if (closedSet.has(currentString)) continue;

      closedSet.add(currentString);
      nodesExplored++;

      if (currentString === targetString) {
        const path = [];
        let node = current;
        while (node.parent) {
          path.unshift(node.move);
          node = node.parent;
        }
        console.log(
          `A* found solution: ${path.length} moves, ${nodesExplored} nodes`
        );
        return { found: true, path, nodesExplored };
      }

      const neighbors = this.getNeighbors(current.tiles);
      for (const neighbor of neighbors) {
        const neighborString = neighbor.tiles.join(",");

        if (closedSet.has(neighborString)) continue;

        const g = current.g + 1;
        const existingG = visited.get(neighborString);

        if (existingG === undefined || g < existingG) {
          const h = this.manhattanDistance(neighbor.tiles);
          visited.set(neighborString, g);

          // Insert in roughly the right position for efficiency
          const newNode = {
            tiles: neighbor.tiles,
            g,
            h,
            f: g + h,
            parent: current,
            move: neighbor.move,
          };

          openSet.push(newNode);
        }
      }
    }

    console.log(`A* failed: explored ${nodesExplored} nodes`);
    return { found: false, nodesExplored };
  };

  // Weighted A* Algorithm - trades optimality for speed
  weightedAStarSolve = async (startTiles, targetString) => {
    const weight = 2.0; // Higher weight = faster but less optimal
    const openSet = [
      {
        tiles: startTiles,
        g: 0,
        h: this.manhattanDistance(startTiles),
        f: 0,
        parent: null,
        move: null,
      },
    ];

    openSet[0].f = openSet[0].g + weight * openSet[0].h;
    const closedSet = new Set();
    const visited = new Map([[startTiles.join(","), 0]]);

    let nodesExplored = 0;
    const maxIterations = 100000;
    const initialHeuristic = this.manhattanDistance(startTiles);

    console.log(
      `Weighted A* (w=${weight}) starting with initial heuristic: ${initialHeuristic}`
    );

    while (openSet.length > 0 && nodesExplored < maxIterations) {
      if (nodesExplored % 1000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 2));
        if (nodesExplored % 5000 === 0) {
          console.log(
            `Weighted A*: ${nodesExplored} nodes, open set: ${openSet.length}`
          );
        }
      }

      // More frequent sorting for better performance
      if (nodesExplored % 50 === 0) {
        openSet.sort((a, b) => a.f - b.f);
      }

      const current = openSet.shift();
      const currentString = current.tiles.join(",");

      if (closedSet.has(currentString)) continue;

      closedSet.add(currentString);
      nodesExplored++;

      if (currentString === targetString) {
        const path = [];
        let node = current;
        while (node.parent) {
          path.unshift(node.move);
          node = node.parent;
        }
        console.log(
          `Weighted A* found solution: ${path.length} moves, ${nodesExplored} nodes`
        );
        return { found: true, path, nodesExplored };
      }

      const neighbors = this.getNeighbors(current.tiles);
      for (const neighbor of neighbors) {
        const neighborString = neighbor.tiles.join(",");

        if (closedSet.has(neighborString)) continue;

        const g = current.g + 1;
        const existingG = visited.get(neighborString);

        if (existingG === undefined || g < existingG) {
          const h = this.manhattanDistance(neighbor.tiles);
          visited.set(neighborString, g);

          const newNode = {
            tiles: neighbor.tiles,
            g,
            h,
            f: g + weight * h, // Weighted heuristic
            parent: current,
            move: neighbor.move,
          };

          openSet.push(newNode);
        }
      }
    }

    console.log(`Weighted A* failed: explored ${nodesExplored} nodes`);
    return { found: false, nodesExplored };
  };

  // IDA* Algorithm
  idaStarSolve = async (startTiles, targetString) => {
    let threshold = this.manhattanDistance(startTiles);
    let totalNodesExplored = 0;
    const maxDepth = 60;

    while (threshold < maxDepth) {
      const result = await this.idaStarSearch(
        startTiles,
        0,
        threshold,
        null,
        [],
        targetString
      );
      totalNodesExplored += result.nodesExplored;

      if (result.found) {
        return {
          found: true,
          path: result.path,
          nodesExplored: totalNodesExplored,
        };
      }

      if (result.minThreshold === Infinity) break;
      threshold = result.minThreshold;

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    return { found: false, nodesExplored: totalNodesExplored };
  };

  // IDA* recursive search
  idaStarSearch = async (tiles, g, threshold, lastMove, path, targetString) => {
    const f = g + this.manhattanDistance(tiles);

    if (f > threshold) {
      return { found: false, minThreshold: f, nodesExplored: 1 };
    }

    if (tiles.join(",") === targetString) {
      return { found: true, path, nodesExplored: 1 };
    }

    let minThreshold = Infinity;
    let totalNodesExplored = 1;
    const neighbors = this.getNeighbors(tiles);

    for (const neighbor of neighbors) {
      if (lastMove !== null && neighbor.move === lastMove) continue;

      const result = await this.idaStarSearch(
        neighbor.tiles,
        g + 1,
        threshold,
        tiles.indexOf(""),
        [...path, neighbor.move],
        targetString
      );

      totalNodesExplored += result.nodesExplored;

      if (result.found) {
        return {
          found: true,
          path: result.path,
          nodesExplored: totalNodesExplored,
        };
      }

      if (result.minThreshold < minThreshold) {
        minThreshold = result.minThreshold;
      }

      if (totalNodesExplored % 2000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return { found: false, minThreshold, nodesExplored: totalNodesExplored };
  };

  // Execute the solution moves with animation
  executeSolution = async (moves, stats) => {
    try {
      for (let i = 0; i < moves.length; i++) {
        if (!this.state.solving) break; // Allow cancellation
        await new Promise((resolve) => setTimeout(resolve, 300));
        this.swapTiles(moves[i]);
      }

      this.setState({
        solving: false,
        solutionStats: stats,
      });
    } catch (error) {
      console.error("Error executing solution:", error);
      this.setState({ solving: false });
    }
  };

  render() {
    const {
      tiles,
      win,
      highScore,
      gameTime,
      solving,
      solutionStats,
      selectedAlgorithm,
      comparisonMode,
      comparisonResults,
      currentProgress,
    } = this.state;

    return (
      <div className="App">
        <div className={`main-container${(solutionStats || (comparisonResults && comparisonResults.length > 0) || currentProgress) ? ' has-results' : ''}`}>
          {/* Left Column - Game Board and Controls */}
          <div className="game-section">
            <div className="win-message">{win && <h2>You win!</h2>}</div>

            <div className="score-display">
              <p>Current: {this.formatTime(gameTime)}</p>
              <p>Best: {highScore ? this.formatTime(highScore) : "?"}</p>
            </div>

            <div className="grid">
              {tiles.map((tile, i) => (
                <button
                  id={`tile-${i}`}
                  key={i}
                  onClick={() => this.swapTiles(i)}
                  className={tile === "" ? "empty" : "square"}
                >
                  {tile !== "" ? tile + 1 : ""}
                </button>
              ))}
            </div>

            <div className="algorithm-controls">
              <div className="algorithm-selection">
                <label>Algorithm:</label>
                <select
                  value={selectedAlgorithm}
                  onChange={(e) =>
                    this.setState({ selectedAlgorithm: e.target.value })
                  }
                  disabled={solving}
                >
                  <option value="greedy">Greedy</option>
                  <option value="bfs">BFS</option>
                  <option value="wastar">Weighted A*</option>
                  <option value="beam">Beam Search</option>
                  <option value="astar">A*</option>
                  <option value="idastar">IDA*</option>
                </select>
              </div>

              <div className="mode-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={comparisonMode}
                    onChange={(e) =>
                      this.setState({
                        comparisonMode: e.target.checked,
                        comparisonResults: [],
                      })
                    }
                    disabled={solving}
                  />
                  Compare All Algorithms
                </label>
              </div>
            </div>

            <div className="button-group">
              <button className="game-button primary" onClick={this.solvePuzzle} disabled={solving || win}>
                {solving
                  ? comparisonMode
                    ? "Running Comparison..."
                    : "Solving..."
                  : comparisonMode
                  ? "Compare All"
                  : "Auto Solve"}
              </button>
              <button className="game-button secondary" onClick={this.resetGame} disabled={solving}>
                Reset Board
              </button>
              <button
                className="game-button secondary"
                onClick={() => {
                  const testTiles = [0,1,2,3,4,5,6,7,8,9,10,11,13,14,"",12];
                  this.setState({ tiles: testTiles, win: false, solutionStats: null });
                }}
              >
                Test State
              </button>
              <button className="game-button secondary" onClick={this.resetHighScore}>
                Reset High Score
              </button>
            </div>
          </div>

          {/* Right Column - Results and Progress */}
          <div className="results-section">
            {solving && currentProgress && (
          <div className="progress-display">
            <h3>🔄 Algorithm Progress</h3>
            <div className="progress-info">
              <p>
                <strong>Algorithm:</strong> {currentProgress.algorithm}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {currentProgress.status === "starting"
                  ? "🚀 Starting..."
                  : currentProgress.status === "running"
                  ? "⚙️ Running..."
                  : currentProgress.status === "solution_found"
                  ? "✅ Solution Found!"
                  : currentProgress.status === "completed"
                  ? "✅ Completed"
                  : currentProgress.status === "timeout"
                  ? "⏱️ Timeout"
                  : currentProgress.status === "failed"
                  ? "❌ Failed"
                  : "🔄 Processing..."}
              </p>
              <p>
                <strong>Nodes Explored:</strong>{" "}
                {currentProgress.nodesExplored?.toLocaleString() || 0}
              </p>
              <p>
                <strong>Time Elapsed:</strong>{" "}
                {((currentProgress.elapsedTime || 0) / 1000).toFixed(1)}s
              </p>
              {currentProgress.depth && (
                <p>
                  <strong>Current Depth:</strong> {currentProgress.depth}
                </p>
              )}
              {currentProgress.queueSize && (
                <p>
                  <strong>Queue Size:</strong>{" "}
                  {currentProgress.queueSize.toLocaleString()}
                </p>
              )}
              {currentProgress.algorithmIndex && (
                <p>
                  <strong>Progress:</strong> {currentProgress.algorithmIndex}/
                  {currentProgress.totalAlgorithms} algorithms
                </p>
              )}
            </div>
          </div>
        )}

        {solutionStats && !comparisonMode && (
          <div className="solution-stats">
            <h3>Solution Complete!</h3>
            <p>
              Algorithm:{" "}
              {solutionStats.algorithm ||
                (selectedAlgorithm ? selectedAlgorithm.toUpperCase() : "BEAM")}
            </p>
            <p>Moves: {solutionStats.moves}</p>
            <p>Nodes Explored: {solutionStats.nodesExplored}</p>
            <p>Time: {solutionStats.timeTaken}ms</p>
            {solutionStats.note && (
              <p style={{ color: "#FFA500" }}>{solutionStats.note}</p>
            )}
          </div>
        )}

        {comparisonResults && comparisonResults.length > 0 && (
          <div className="comparison-results">
            <h3>Algorithm Comparison Results</h3>
            <div className="results-table">
              <div className="table-header">
                <span>Rank</span>
                <span>Algorithm</span>
                <span>Status</span>
                <span>Moves</span>
                <span>Nodes</span>
                <span>Time</span>
              </div>
              {comparisonResults.map((result, index) => (
                <div
                  key={result?.algorithm || index}
                  className={`table-row ${
                    result?.success ? "success" : "failed"
                  }`}
                >
                  <span className="rank">#{index + 1}</span>
                  <span className="algorithm">
                    {result?.algorithm || "Unknown"}
                  </span>
                  <span className="status">
                    {result?.timeout
                      ? "⏱️ Timeout"
                      : result?.success
                      ? "✅ Success"
                      : "❌ Failed"}
                  </span>
                  <span className="moves">
                    {result?.success ? result.moves || 0 : "-"}
                  </span>
                  <span className="nodes">
                    {(result?.nodesExplored || 0).toLocaleString()}
                  </span>
                  <span className="time">
                    {((result?.timeTaken || 0) / 1000).toFixed(1)}s
                  </span>
                </div>
              ))}
            </div>
            {comparisonResults?.length === 5 && !solving && (
              <div className="comparison-summary">
                <p>
                  <strong>🏆 Best Solution:</strong>{" "}
                  {comparisonResults.find((r) => r?.success)?.algorithm ||
                    "None found"}
                </p>
                <p>
                  <strong>⚡ Fastest:</strong>{" "}
                  {comparisonResults
                    .filter((r) => r?.success)
                    .sort(
                      (a, b) => (a?.timeTaken || 0) - (b?.timeTaken || 0)
                    )[0]?.algorithm || "None"}
                </p>
              </div>
            )}
            </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
