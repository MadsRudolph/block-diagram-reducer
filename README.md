# 📊 Control System Block Diagram Reducer

A premium, interactive **Symbolic Block Diagram Reduction Tool** designed to mathematically solve and visually draft control systems block diagrams. It generates **exact, textbook-grade symbolic formulas** alongside complete step-by-step algebraic reduction logs.

Developed to run **100% offline** (perfect for exams or locations with no internet access) as a native Windows desktop application!

---

## ✨ Features

*   **100% Offline Standalone Window:** Packed with local offline KaTeX libraries and high-fidelity system font fallbacks. Running it requires zero internet, zero browser tabs, and zero terminal servers.
*   **Exact Symbolic Engine:** Reduces systems to their most simplified, textbook-perfect rational formulas (algebraically identical to Matlab's `feedback` or `series` functions) using an AST-based algebraic math parser.
*   **Manhattan-Style Interactivity:** Draw wires with sharp 90-degree corners. You can grab and drag segments horizontally or vertically to route them cleanly around blocks.
*   **Dynamic Wire Tapping (Feedback Loops):** Click and drag from subtle midpoint ports on any wire to tap output signals and route them to feedback loop controllers, featuring solid blue **schematic junction dots** that follow drags dynamically in real-time.
*   **Spacious Summing Junctions:** Large summing circles (radius 25) with **inside-circle interactive signs** (`+` or `-`). Simply click a sign to toggle its polar contribution and instantly re-solve.
*   **Resizable Splitter Layout:** Hover and drag the neon blue splitter bar to adjust the solve panel width between `300px` and `800px` to fit even the longest mathematical equations.
*   **Vercel-Grade Copy Actions:** One-click clipboard copying as **Plain Formula Text** (Matlab-compatible) or **LaTeX Code** (ready for KaTeX/LaTeX editors), complete with elegant green success state feedback animations.

---

## 🚀 Quick Start (For Windows Users)

To download and run this app locally:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/MadsRudolph/block-diagram-reducer.git
    cd block-diagram-reducer
    ```

2.  **Double-Click to Play:**
    Open the folder in Windows Explorer and double-click the launcher script:
    **`Double-Click-To-Run.bat`**

    *   **What this does:** It automatically checks if you have Node.js installed, runs `npm install` to download dependencies locally, makes sure the Electron runtime is present, compiles the JavaScript bundle, and opens the desktop window directly from this folder.
    *   **Subsequent launches:** On all subsequent launches, double-clicking `Double-Click-To-Run.bat` will skip the installer and boot up the desktop application natively in under a second!
    *   **Staying up to date:** Because the app runs live from this cloned folder (not a frozen packaged copy), the in-app **Check for Updates** button can `git pull` the latest code, rebuild, and reload so new features appear immediately.

---

## 📚 Worked Exam Examples Included

The app features a sidebar with pre-defined control system templates from DTU exam sheets. Click any template to watch the canvas layout and solve the transfer function instantly:

### 1. Simple Feedback Loop
*   A standard forward transfer function $G(s) = \frac{10}{s^2 + 2s}$ with a feedback gain of $H = 2$.
*   Yields the exact closed-loop formula:
    $$\frac{Y(s)}{R(s)} = \frac{10}{s^2 + 2s + 20}$$

### 2. Exam S20 Q3
*   Two forward paths sharing an internal feedback loop.
*   Closed-loop formula:
    $$\frac{Y(s)}{R(s)} = \frac{A \cdot (s + B + 1) + 1}{s + B + 1}$$

### 3. Exam S21 Q1
*   Parallel forward paths sharing a common feedback block.
*   Closed-loop formula:
    $$\frac{Y(s)}{R(s)} = \frac{B \cdot C + E \cdot (B \cdot F + 1)}{B \cdot F + 1}$$

### 4. Exam F22 Q1 (13-Node Complex Diagram)
*   Replicates a massive exam diagram containing multiple cascading forward paths, inner feedback loops, and overlapping feedback paths ($H_1$ and $H_2$).
*   Solves instantly to the **exact textbook-grade simplified equation**:
    $$\frac{Y(s)}{R(s)} = \frac{A \cdot B \cdot E \cdot (C + D)}{(A \cdot B + 1) \cdot (E \cdot H_2 \cdot (C + D) + 1) + A \cdot B \cdot H_1 \cdot (C + D)}$$

---

## 🛠️ Build Commands (For Developers)

If you modify any source code files (`app.js`, `canvas.js`, `solver.js`, or `math-engine.js`), you can compile them using standard NPM commands:

*   `npm run build`: Bundles the ES6 modular JS source into a single browser-compatible `bundle.js` using `esbuild`.
*   `npm start`: Opens your current developer code inside an Electron environment for fast debugging.
*   `npm run package`: (Optional) Packs the codebase and Electron runtime into a standalone Windows build folder (`BlockDiagramReducer-win32-x64/`). Note: a packaged build is a frozen snapshot and will **not** receive in-app updates — use `Double-Click-To-Run.bat` for the self-updating experience.

---

## 🎓 Academic Credit & License

Developed for DTU Course **34722 Linear Control Design 1**. 
Licensed under the [MIT License](LICENSE).
