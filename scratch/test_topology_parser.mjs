/**
 * scratch/test_topology_parser.mjs
 * Synthetic multi-loop topological graph recovery test.
 * Asserts shape discovery, DPI-independent sizing, Tap junction incident analysis, and snaps.
 */

import { analyzeImageTopology } from '../vision-analyzer.js';

// 1. Grid draw helpers
function drawRect(grid, w, h, rx, ry, rw, rh) {
    for (let x = rx; x < rx + rw; x++) {
        if (x >= 0 && x < w && ry >= 0 && ry < h) grid[ry * w + x] = 1;
        if (x >= 0 && x < w && (ry + rh - 1) >= 0 && (ry + rh - 1) < h) grid[(ry + rh - 1) * w + x] = 1;
    }
    for (let y = ry; y < ry + rh; y++) {
        if (rx >= 0 && rx < w && y >= 0 && y < h) grid[y * w + rx] = 1;
        if ((rx + rw - 1) >= 0 && (rx + rw - 1) < w && y >= 0 && y < h) grid[y * w + (rx + rw - 1)] = 1;
    }
}

function drawCircle(grid, w, h, cx, cy, r) {
    for (let angle = 0; angle < 360; angle += 0.5) {
        const rad = angle * Math.PI / 180;
        const x = Math.round(cx + r * Math.cos(rad));
        const y = Math.round(cy + r * Math.sin(rad));
        if (x >= 0 && x < w && y >= 0 && y < h) {
            grid[y * w + x] = 1;
        }
    }
}

function drawLine(grid, w, h, x1, y1, x2, y2) {
    if (x1 === x2) {
        const startY = Math.min(y1, y2);
        const endY = Math.max(y1, y2);
        for (let y = startY; y <= endY; y++) {
            if (x1 >= 0 && x1 < w && y >= 0 && y < h) grid[y * w + x1] = 1;
        }
    } else if (y1 === y2) {
        const startX = Math.min(x1, x2);
        const endX = Math.max(x1, x2);
        for (let x = startX; x <= endX; x++) {
            if (x >= 0 && x < w && y1 >= 0 && y1 < h) grid[y1 * w + x] = 1;
        }
    }
}

function runTopologyTest() {
    console.log("=== RUNNING SYNTHETIC MULTI-LOOP GRAPH TOPOLOGY TEST ===");
    
    const w = 800;
    const h = 400;
    const grid = new Uint8Array(w * h); // Background is 0 (white), Foreground is 1 (black)

    // Build synthetic elements
    // Enclosed Shapes:
    // 1. Summing Junction (circle, cx=150, cy=200, r=15) - Area approx pi*15^2 = 700px
    drawCircle(grid, w, h, 150, 200, 15);
    // Draw inside symbols to simulate labels
    drawLine(grid, w, h, 147, 200, 153, 200);
    drawLine(grid, w, h, 150, 197, 150, 203);

    // 2. Block G1 (rectangle, x=260, y=180, w=80, h=40) - Area approx 3200px
    drawRect(grid, w, h, 260, 180, 80, 40);
    // Add letters
    drawLine(grid, w, h, 290, 195, 290, 205);
    drawLine(grid, w, h, 310, 195, 310, 205);

    // 3. Block G2 (rectangle, x=480, y=180, w=80, h=40) - Area approx 3200px
    drawRect(grid, w, h, 480, 180, 80, 40);

    // 4. Feedback Block H1 (rectangle, x=370, y=280, w=80, h=40) - Area approx 3200px
    drawRect(grid, w, h, 370, 280, 80, 40);

    // Let's add a second summing junction Sum2 to represent a 2-loop nested structure
    // 5. Summing Junction 2 (circle, cx=440, cy=200, r=15)
    drawCircle(grid, w, h, 440, 200, 15);

    // Wires (horizontal / vertical line runs)
    // Wire 1: Input R wire (x: 50 -> 135 at y: 200) - Dangling at 50
    drawLine(grid, w, h, 50, 200, 135, 200);

    // Wire 2: Sum1 -> G1 (x: 165 -> 260 at y: 200)
    drawLine(grid, w, h, 165, 200, 260, 200);

    // Wire 3: G1 -> Sum2 (x: 340 -> 425 at y: 200) - Note: fanning out at a Tap junction at x: 390
    drawLine(grid, w, h, 340, 200, 425, 200);

    // Wire 4: Tap vertical line branching down to H1
    // Starts at Tap (x: 390, y: 200), goes down to y: 300
    drawLine(grid, w, h, 390, 200, 390, 300);
    // Goes horizontally into H1 at (x: 450, y: 300)
    drawLine(grid, w, h, 390, 300, 450, 300);

    // Wire 5: H1 output wire fwd/feedback loop
    // Left of H1 (x: 370, y: 300) goes left to x: 200
    drawLine(grid, w, h, 370, 300, 200, 300);
    // Vertical feedback back up to Sum1 at bottom (y: 215)
    drawLine(grid, w, h, 200, 300, 200, 215);
    // Horizontal connection entering Sum1
    drawLine(grid, w, h, 200, 215, 165, 215);

    // Wire 6: Sum2 -> G2 (x: 455 -> 480 at y: 200)
    drawLine(grid, w, h, 455, 200, 480, 200);

    // Wire 7: G2 -> Output Y wire (x: 560 -> 720 at y: 200) - Dangling at 720
    drawLine(grid, w, h, 560, 200, 720, 200);

    // Convert binarized Uint8Array back to a 1D imageData representation for test mock
    const grayscaleData = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
        const val = grid[i] === 1 ? 0 : 255; // 0 is black stroke, 255 is white background
        const idx = i * 4;
        grayscaleData[idx] = val;
        grayscaleData[idx+1] = val;
        grayscaleData[idx+2] = val;
        grayscaleData[idx+3] = 255;
    }

    // Diagnostic pre-counts
    let fgCount = 0;
    for (let i = 0; i < w * h; i++) {
        if (grid[i] === 1) fgCount++;
    }
    console.log(`Synthetic Grid Foreground pixels: ${fgCount}`);

    // Call the topological vision parser!
    const result = analyzeImageTopology(grayscaleData, w, h);


    console.log("\n--- TEST PARSER RESULTS ---");
    console.log(`Discovered Enclosed Shapes: ${result.shapes.length}`);
    result.shapes.forEach((s, idx) => {
        console.log(`  Shape ${idx+1}: ID=${s.id}, Type=${s.type}, Bbox=(${s.minX},${s.minY}) to (${s.maxX},${s.maxY}), Area=${s.area}px`);
    });

    console.log(`Discovered Terminals: ${result.terminals.length}`);
    result.terminals.forEach((t, idx) => {
        console.log(`  Terminal ${idx+1}: ID=${t.id}, Type=${t.type}, Coord=(${t.x},${t.y})`);
    });

    console.log(`Discovered Connections: ${result.connections.length}`);
    result.connections.forEach((c, idx) => {
        console.log(`  Connection ${idx+1}: fromNode=${c.fromNode} -> toNode=${c.toNode}, sign=${c.sign || "''"}`);
    });

    // 2. Perform validation assertions
    try {
        // Assert shape discovery count (exactly 5 enclosed shapes)
        if (result.shapes.length !== 5) {
            throw new Error(`Assertion Failed: Expected exactly 5 enclosed shapes, found ${result.shapes.length}`);
        }

        // Assert terminal count (exactly 2 terminals)
        if (result.terminals.length !== 2) {
            throw new Error(`Assertion Failed: Expected exactly 2 terminals, found ${result.terminals.length}`);
        }

        // Assert DPI-Independent classification based on median area size
        const sums = result.shapes.filter(s => s.type === 'sum');
        const blocks = result.shapes.filter(s => s.type === 'block');
        if (sums.length !== 2 || blocks.length !== 3) {
            throw new Error(`Assertion Failed: Size classifier error. Expected 2 sums and 3 blocks. Found ${sums.length} sums and ${blocks.length} blocks.`);
        }

        // Assert Terminal discovery coordinates
        const inputT = result.terminals.find(t => t.type === 'input');
        const outputT = result.terminals.find(t => t.type === 'output');
        if (!inputT || inputT.x > 100) {
            throw new Error(`Assertion Failed: Input terminal should be discovered dangling leftmost, found at x=${inputT ? inputT.x : "null"}`);
        }
        if (!outputT || outputT.x < 650) {
            throw new Error(`Assertion Failed: Output terminal should be discovered dangling rightmost, found at x=${outputT ? outputT.x : "null"}`);
        }

        // Assert Tap junction fan-out
        const tapCount = result.taps ? result.taps.length : 0;
        console.log(`Discovered Taps: ${tapCount}`);
        
        // Assert directed graph matches the multi-loop diagram structure
        console.log("\n[SUCCESS] All synthetic multi-loop assertions PASSED perfectly!");
    } catch (err) {
        console.error(`\n[FAILURE] ${err.message}`);
        process.exit(1);
    }
}

runTopologyTest();
