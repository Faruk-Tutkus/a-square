
# A Square's Life

**A Square's Life** is a cinematic, atmospheric puzzle-platformer that blends minimalist aesthetics with tight physics-based gameplay. The player guides a solitary square through a monochrome world filled with shadows, geometric enemies, and environmental puzzles.

This project demonstrates a hybrid architecture, combining the UI state management of **React** with the high-performance 2D rendering and physics engine of **Phaser 3**, all underpinned by a custom **Procedural Audio Engine** that generates sound effects and music in real-time without external assets.

## 🎮 Gameplay Features

*   **Atmospheric Visuals:** A stark, high-contrast monochrome style enhanced with film grain and vignette effects to create a moody, "Limbo-like" ambiance.
*   **Precision Platforming:** Mechanics include double jumping, wall interactions, and momentum-based movement.
*   **Combat System:** The player wields a "Light Gun" to fend off various geometric hostile entities.
*   **Puzzle Elements:** Interactive environments featuring:
    *   Pushable boxes with physics mass.
    *   Pressure-sensitive buttons (Hold vs. Once behaviors).
    *   Logic-gated doors and key/lock systems.
    *   Portals for level transitions.
*   **Diverse Enemies:**
    *   **Basic:** Simple patrolling units.
    *   **Hunter:** Aggressive units that can jump and chase the player.
    *   **Ranged:** Stationary units that fire tracking projectiles.
    *   **Rapid:** Fast-moving units with burst-fire capabilities.
    *   **Heavy:** Tank-like units with high HP that produce metallic, robotic sounds and require sustained damage to defeat.

## 🔊 Procedural Audio Engine

One of the core technical features of this project is its zero-asset audio system. There are no `.mp3` or `.wav` files.

*   **Real-time Synthesis:** All sounds—from the dark ambient drone music to the metallic thud of a heavy enemy—are generated instantly using the Web Audio API.
*   **Dynamic Sound Generation:**
    *   **Music:** Uses low-frequency oscillators (LFOs) and filtered sawtooth waves to create a dynamic, brooding soundscape.
    *   **SFX:** Mathematical functions modulate frequency and gain to simulate physical sounds (e.g., sliding doors use noise filters, shooting uses pitch decay).
    *   **Spatial Awareness:** Sounds like door movements and enemy alerts are triggered based on game state logic.

## 🛠 Tech Stack & Architecture

### Core Technologies
*   **Frontend Framework:** React 19
*   **Game Engine:** Phaser 3.80 (Arcade Physics)
*   **Styling:** Tailwind CSS
*   **Language:** TypeScript

### Architecture Overview
The application uses a layered architecture to separate game logic from UI concerns:

1.  **React Layer (`App.tsx`, `UIOverlay.tsx`):**
    *   Manages the global game state (Menu, Playing, Paused, Level Select).
    *   Handles the HUD (Heads-Up Display), settings menus, and touch controls.
    *   Initializes and manages the Audio Engine context.

2.  **Phaser Layer (`GameCanvas.tsx`):**
    *   Handles the game loop, rendering, and physics collisions.
    *   Parses level configuration data (`JSON`) to instantiate game objects.
    *   Manages enemy AI behaviors and particle effects.
    *   Communicates events (death, level complete) back to React via callbacks.

3.  **Data-Driven Design:**
    *   All levels are defined in `constants.ts` (or `levels.json`) as structured JSON objects.
    *   This allows for easy modification of level layouts, enemy placement, and scripts without changing the core codebase.

## 🗺️ Integrated Level Editor

The project includes a fully functional **Map Editor** built directly into the game.

*   **WYSIWYG Editing:** Click to place platforms, enemies, and triggers on a grid.
*   **Property Inspection:** Modify properties of selected objects (e.g., Enemy HP, Button Link IDs, Door Heights).
*   **Campaign Management:** Create multi-level campaigns within the browser.
*   **Playtest Mode:** Instantly switch from editing to playing to test level flow.
*   **Export:** Download custom campaigns as JSON files to share or integrate into the main game.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16 or higher)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/a-squares-life.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```
4.  Open `http://localhost:1234` (or the port shown in your terminal) in your browser.

## 🕹 Controls

| Action | Desktop (Keyboard) | Mobile (Touch) |
| :--- | :--- | :--- |
| **Move** | Arrow Keys / WASD | On-screen Arrows |
| **Jump** | Space / Up Arrow | Jump Button |
| **Shoot** | Z / Click | Fire Button |
| **Pause** | ESC | Pause Icon |

## 📂 Project Structure

```
/
├── components/
│   ├── GameCanvas.tsx    # Phaser game instance & logic
│   ├── UIOverlay.tsx     # React HUD & Touch Controls
│   └── MapEditor.tsx     # Level Editor logic
├── audio.ts              # Procedural Audio Engine
├── types.ts              # TypeScript interfaces for Game Config
├── constants.ts          # Level data and game configuration
├── App.tsx               # Main entry point & State Manager
├── index.html            # Entry HTML
└── tailwind.config.js    # Styling configuration
```

---
*Built with passion for minimalist design and clean code.*
