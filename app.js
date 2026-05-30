/**
 * app.js
 * Main controller orchestrating UI events, diagram state changes, 
 * KaTeX formula rendering, and loading pre-defined exam templates.
 */

import { BlockDiagramCanvas } from './canvas.js';
import { solveBlockDiagram } from './solver.js';
import { TransferFunction } from './math-engine.js';

document.addEventListener('DOMContentLoaded', () => {
    const svgEl = document.getElementById('diagram-svg');
    
    // UI Elements
    const addInputBtn = document.getElementById('add-input-btn');
    const addOutputBtn = document.getElementById('add-output-btn');
    const addBlockBtn = document.getElementById('add-block-btn');
    const addSumBtn = document.getElementById('add-sum-btn');
    const solveBtn = document.getElementById('solve-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    const propPanel = document.getElementById('properties-panel');
    const noPropMsg = document.getElementById('no-properties-msg');
    const propLabelInput = document.getElementById('prop-label');
    const propValInput = document.getElementById('prop-value');
    const propValLabel = document.getElementById('prop-value-label');
    
    const tfOutput = document.getElementById('tf-output');
    const stepsOutput = document.getElementById('steps-output');
    
    // Initialize Canvas
    const canvas = new BlockDiagramCanvas(svgEl, () => {
        handleStateChange();
        updateDiagramStats();
    });

    // Add Nodes
    addInputBtn.addEventListener('click', () => {
        canvas.addNode('input', 80, 200, '1', 'R');
    });
    addOutputBtn.addEventListener('click', () => {
        canvas.addNode('output', 600, 200, '1', 'Y');
    });
    addBlockBtn.addEventListener('click', () => {
        canvas.addNode('block', 300, 200, 'G(s)', 'G1');
    });
    addSumBtn.addEventListener('click', () => {
        canvas.addNode('sum', 180, 200, '', 'Σ');
    });

    // Clear Canvas
    clearBtn.addEventListener('click', () => {
        canvas.clear();
        clearMathDisplays();
    });

    // Solve Loop
    solveBtn.addEventListener('click', () => {
        triggerSolve();
    });

    // Handle selection and properties editing
    function handleStateChange() {
        const sel = canvas.selectedElement;
        
        if (sel && sel.type === 'node') {
            const node = canvas.nodes.find(n => n.id === sel.id);
            if (node) {
                propPanel.style.display = 'block';
                noPropMsg.style.display = 'none';
                
                propLabelInput.value = node.label;
                
                if (node.type === 'sum') {
                    propValInput.style.display = 'none';
                    propValLabel.style.display = 'none';
                } else {
                    propValInput.style.display = 'block';
                    propValLabel.style.display = 'block';
                    propValInput.value = node.value;
                    propValLabel.textContent = node.type === 'block' ? 'Transfer Function' : 'Value';
                }
            }
        } else {
            propPanel.style.display = 'none';
            noPropMsg.style.display = 'block';
        }
    }

    // Properties input change handlers
    propLabelInput.addEventListener('input', (e) => {
        const sel = canvas.selectedElement;
        if (sel && sel.type === 'node') {
            canvas.updateNodeLabel(sel.id, e.target.value);
        }
    });

    propValInput.addEventListener('input', (e) => {
        const sel = canvas.selectedElement;
        if (sel && sel.type === 'node') {
            canvas.updateNodeValue(sel.id, e.target.value);
        }
    });

    let lastSolutionResult = null;
    const copyActionsContainer = document.getElementById('copy-actions-container');
    const copyTextBtn = document.getElementById('copy-text-btn');
    const copyLatexBtn = document.getElementById('copy-latex-btn');

    if (copyTextBtn) {
        copyTextBtn.addEventListener('click', () => {
            if (!lastSolutionResult) return;
            const formulaStr = `Y(s)/R(s) = ${lastSolutionResult.finalTransferFunction.toFormulaString()}`;
            navigator.clipboard.writeText(formulaStr).then(() => {
                showCopySuccess(copyTextBtn, "Copied Text!");
            });
        });
    }

    if (copyLatexBtn) {
        copyLatexBtn.addEventListener('click', () => {
            if (!lastSolutionResult) return;
            const latexStr = `\\frac{Y(s)}{R(s)} = ${lastSolutionResult.finalTransferFunction.toKaTeX()}`;
            navigator.clipboard.writeText(latexStr).then(() => {
                showCopySuccess(copyLatexBtn, "Copied LaTeX!");
            });
        });
    }

    function showCopySuccess(btn, successText) {
        const originalText = btn.innerHTML;
        btn.innerHTML = successText;
        btn.classList.add('success');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('success');
        }, 1500);
    }

    // Solver logic trigger
    function triggerSolve() {
        try {
            const result = solveBlockDiagram(canvas.nodes, canvas.connections);
            lastSolutionResult = result;
            renderMathSolution(result);
            if (copyActionsContainer) copyActionsContainer.style.display = 'flex';
        } catch (e) {
            console.error(e);
            lastSolutionResult = null;
            if (copyActionsContainer) copyActionsContainer.style.display = 'none';
            tfOutput.innerHTML = `<span style="color: var(--accent-red); font-size: 13px;">Error: ${e.message}</span>`;
            stepsOutput.innerHTML = `<div style="color: var(--text-secondary); font-size: 12px; font-style: italic;">Could not solve the system of equations. Make sure your nodes are fully connected from R to Y.</div>`;
        }
    }

    function clearMathDisplays() {
        lastSolutionResult = null;
        if (copyActionsContainer) copyActionsContainer.style.display = 'none';
        tfOutput.innerHTML = `<span style="color: var(--text-secondary); font-size: 13px;">Diagram solved TF will appear here.</span>`;
        stepsOutput.innerHTML = `<div style="color: var(--text-secondary); font-size: 12px; font-style: italic; text-align: center; margin-top: 40px;">Connect your input R to output Y and blocks, then solve to view algebraic steps.</div>`;
        updateDiagramStats();
    }

    function updateDiagramStats() {
        const blocksCount = canvas.nodes.filter(n => n.type === 'block').length;
        const sumsCount = canvas.nodes.filter(n => n.type === 'sum').length;
        const connsCount = canvas.connections.length;
        
        let loopsCount = 0;
        canvas.connections.forEach(c => {
            const fromNode = canvas.nodes.find(n => n.id === c.fromNode);
            const toNode = canvas.nodes.find(n => n.id === c.toNode);
            if (fromNode && toNode && toNode.x < fromNode.x) {
                loopsCount++;
            }
        });

        const blocksEl = document.getElementById('stats-blocks');
        const sumsEl = document.getElementById('stats-sums');
        const connsEl = document.getElementById('stats-conns');
        const loopsEl = document.getElementById('stats-loops');

        if (blocksEl) blocksEl.textContent = blocksCount;
        if (sumsEl) sumsEl.textContent = sumsCount;
        if (connsEl) connsEl.textContent = connsCount;
        if (loopsEl) loopsEl.textContent = loopsCount;
    }

    function renderMathSolution(result) {
        if (!window.katex) {
            // Safe fallback if CDN fails
            tfOutput.textContent = `Y(s)/R(s) = ${result.finalTransferFunction.toFormulaString()}`;
            stepsOutput.innerHTML = result.initialEquations.map(eq => `<div class="step-item initial">${eq}</div>`).join('');
            return;
        }

        // Render Final Transfer Function
        const latexStr = `\\frac{Y(s)}{R(s)} = ${result.finalTransferFunction.toKaTeX()}`;
        tfOutput.innerHTML = '';
        const tfContainer = document.createElement('div');
        katex.render(latexStr, tfContainer, { displayMode: true, throwOnError: false });
        tfOutput.appendChild(tfContainer);

        // Render steps
        stepsOutput.innerHTML = '';
        
        // Render initial system equations
        const initTitle = document.createElement('h4');
        initTitle.textContent = "Initial Loop Relations";
        initTitle.style.cssText = "font-size: 12px; margin-bottom: 8px; color: var(--accent-blue);";
        stepsOutput.appendChild(initTitle);

        result.initialEquations.forEach(eq => {
            // Render equations
            const item = document.createElement('div');
            item.className = 'step-item initial';
            katex.render(eq, item, { displayMode: false, throwOnError: false });
            stepsOutput.appendChild(item);
        });

        // Render elimination logs
        const elimTitle = document.createElement('h4');
        elimTitle.textContent = "Matrix Reductions";
        elimTitle.style.cssText = "font-size: 12px; margin-top: 16px; margin-bottom: 8px; color: var(--accent-purple);";
        stepsOutput.appendChild(elimTitle);

        result.steps.forEach(step => {
            const item = document.createElement('div');
            item.className = 'step-item';
            item.textContent = step;
            stepsOutput.appendChild(item);
        });
    }

    // Templates setup
    const templateItems = document.querySelectorAll('.template-item');
    templateItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const btn = e.target.closest('.template-item');
            const templateType = btn.getAttribute('data-template');
            loadTemplate(templateType);
        });
    });

    function loadTemplate(type) {
        canvas.clear();
        clearMathDisplays();

        if (type === 'feedback') {
            // Simple Negative Feedback G / H
            const r = canvas.addNode('input', 80, 200, '1', 'R');
            const sum = canvas.addNode('sum', 200, 200, '', 'Σ');
            const g = canvas.addNode('block', 350, 200, '10 / (s^2 + 2s)', 'G');
            const h = canvas.addNode('block', 350, 320, '2', 'H');
            h.direction = 'left'; // Pre-rotate feedback block
            const y = canvas.addNode('output', 580, 200, '1', 'Y');

            canvas.connections.push(
                { id: canvas.generateId('conn'), fromNode: r.id, toNode: sum.id, sign: '+' },
                { id: canvas.generateId('conn'), fromNode: sum.id, toNode: g.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: g.id, toNode: y.id, sign: '' },
                
                // Feedback loop branching from G output, going through H to Sum negative
                { id: canvas.generateId('conn'), fromNode: g.id, toNode: h.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: h.id, toNode: sum.id, sign: '-' }
            );
        } else if (type === 's20q3') {
            // Exam S20 Q3
            const r = canvas.addNode('input', 70, 200, '1', 'R');
            const sum = canvas.addNode('sum', 190, 200, '', 'Σ1');
            const g1 = canvas.addNode('block', 320, 200, '1 / (s + B)', 'G_ol');
            const a = canvas.addNode('block', 320, 90, 'A', 'A');
            const sum2 = canvas.addNode('sum', 460, 200, '', 'Σ2');
            const y = canvas.addNode('output', 570, 200, '1', 'Y');

            canvas.connections.push(
                { id: canvas.generateId('conn'), fromNode: r.id, toNode: sum.id, sign: '+' },
                { id: canvas.generateId('conn'), fromNode: r.id, toNode: a.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: sum.id, toNode: g1.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: g1.id, toNode: sum2.id, sign: '+' },
                { id: canvas.generateId('conn'), fromNode: a.id, toNode: sum2.id, sign: '+' },
                { id: canvas.generateId('conn'), fromNode: sum2.id, toNode: y.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: g1.id, toNode: sum.id, sign: '-' } // internal feedback loop
            );
        } else if (type === 's21q1') {
            // Exam S21 Q1: two forward paths sharing one loop BCF
            const r = canvas.addNode('input', 70, 200, '1', 'R');
            const sum1 = canvas.addNode('sum', 170, 200, '', 'Σ1');
            const sum2 = canvas.addNode('sum', 270, 200, '', 'Σ2');
            const b = canvas.addNode('block', 380, 200, 'B', 'B');
            const c = canvas.addNode('block', 500, 200, 'C', 'C');
            const e = canvas.addNode('block', 380, 80, 'E', 'E');
            const f = canvas.addNode('block', 380, 320, 'F', 'F');
            f.direction = 'left'; // Pre-rotate feedback block
            const sum3 = canvas.addNode('sum', 610, 200, '', 'Σ3');
            const y = canvas.addNode('output', 690, 200, '1', 'Y');

            canvas.connections.push(
                { id: canvas.generateId('conn'), fromNode: r.id, toNode: sum1.id, sign: '+' },
                { id: canvas.generateId('conn'), fromNode: r.id, toNode: e.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: sum1.id, toNode: sum2.id, sign: '+' },
                { id: canvas.generateId('conn'), fromNode: sum2.id, toNode: b.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: b.id, toNode: c.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: c.id, toNode: sum3.id, sign: '+' },
                { id: canvas.generateId('conn'), fromNode: e.id, toNode: sum3.id, sign: '+' },
                { id: canvas.generateId('conn'), fromNode: sum3.id, toNode: y.id, sign: '' },
                
                // Feedback loop BCF back to sum2
                { id: canvas.generateId('conn'), fromNode: c.id, toNode: f.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: f.id, toNode: sum2.id, sign: '-' }
            );
        } else if (type === 'f22q1') {
            // Exam F22 Q1: Replicates the exact 13-node diagram in the picture with spacious aligned coordinates
            const r = canvas.addNode('input', 50, 200, '1', 'R');
            const sum1 = canvas.addNode('sum', 150, 200, '', 'Σ1');
            const sum2 = canvas.addNode('sum', 260, 200, '', 'Σ2');
            const a = canvas.addNode('block', 380, 200, 'A', 'A');
            const b = canvas.addNode('block', 500, 200, 'B', 'B');
            const sum3 = canvas.addNode('sum', 610, 200, '', 'Σ3');
            const d = canvas.addNode('block', 730, 120, 'D', 'D');
            const c = canvas.addNode('block', 730, 280, 'C', 'C');
            const sum4 = canvas.addNode('sum', 850, 200, '', 'Σ4');
            const e = canvas.addNode('block', 960, 200, 'E', 'E');
            const y = canvas.addNode('output', 1070, 200, '1', 'Y');
            
            const h1 = canvas.addNode('block', 500, 360, 'H1', 'H1');
            h1.direction = 'left'; // Pre-rotate feedback block
            
            const h2 = canvas.addNode('block', 780, 50, 'H2', 'H2');
            h2.direction = 'left'; // Pre-rotate feedback block

            canvas.connections.push(
                { id: canvas.generateId('conn'), fromNode: r.id, toNode: sum1.id, sign: '+' },
                { id: canvas.generateId('conn'), fromNode: sum1.id, toNode: sum2.id, sign: '+' },
                { id: canvas.generateId('conn'), fromNode: sum2.id, toNode: a.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: a.id, toNode: b.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: b.id, toNode: sum2.id, sign: '-' }, // inner loop
                { id: canvas.generateId('conn'), fromNode: b.id, toNode: sum3.id, sign: '+' },
                
                { id: canvas.generateId('conn'), fromNode: sum3.id, toNode: c.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: sum3.id, toNode: d.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: c.id, toNode: sum4.id, sign: '+' },
                { id: canvas.generateId('conn'), fromNode: d.id, toNode: sum4.id, sign: '+' },
                
                { id: canvas.generateId('conn'), fromNode: sum4.id, toNode: h1.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: h1.id, toNode: sum1.id, sign: '-' }, // H1 loop
                
                { id: canvas.generateId('conn'), fromNode: sum4.id, toNode: e.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: e.id, toNode: y.id, sign: '' },
                
                { id: canvas.generateId('conn'), fromNode: e.id, toNode: h2.id, sign: '' },
                { id: canvas.generateId('conn'), fromNode: h2.id, toNode: sum3.id, sign: '-' } // H2 loop
            );
        }

        canvas.render();
        triggerSolve();
    }

    // -------------------------------------------------------------
    // Resizable Right Panel Splitter
    // -------------------------------------------------------------
    const resizeHandle = document.getElementById('right-resize-handle');
    const container = document.querySelector('.app-container');
    
    if (resizeHandle && container) {
        let isResizing = false;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isResizing = true;
            resizeHandle.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const containerRect = container.getBoundingClientRect();
            let newWidth = containerRect.right - e.clientX;
            
            // Constrain width
            newWidth = Math.max(300, Math.min(800, newWidth));
            
            container.style.setProperty('--right-panel-width', `${newWidth}px`);
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizeHandle.classList.remove('active');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                // Fire a window resize event to let SVG canvas adjust
                window.dispatchEvent(new Event('resize'));
            }
        });
    }

    // -------------------------------------------------------------
    // Standalone Desktop App Updater (GitHub Git Integration)
    // -------------------------------------------------------------
    const updateSection = document.getElementById('update-section');
    const updateBtn = document.getElementById('update-btn');
    const updateStatusMsg = document.getElementById('update-status-msg');

    // Dynamically show updater only inside Electron standalone window
    if (window.electronAPI) {
        if (updateSection) updateSection.style.display = 'block';

        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                updateBtn.disabled = true;
                updateBtn.style.opacity = '0.6';
                window.electronAPI.checkUpdate();
            });
        }

        // Receive real-time update execution status logs from Main Process
        window.electronAPI.onUpdateStatus((info) => {
            if (!updateStatusMsg) return;

            updateStatusMsg.textContent = info.message;

            if (info.status === 'checking') {
                updateStatusMsg.style.color = 'var(--accent-blue)';
            } else if (info.status === 'updating') {
                updateStatusMsg.style.color = 'var(--accent-purple)';
            } else if (info.status === 'success') {
                updateStatusMsg.style.color = 'var(--accent-green)';
            } else if (info.status === 'up-to-date') {
                updateStatusMsg.style.color = 'var(--text-secondary)';
                if (updateBtn) {
                    updateBtn.disabled = false;
                    updateBtn.style.opacity = '1';
                }
            } else if (info.status === 'error') {
                updateStatusMsg.style.color = 'var(--accent-red)';
                if (updateBtn) {
                    updateBtn.disabled = false;
                    updateBtn.style.opacity = '1';
                }
            }
        });
    }

    // Global keyboard shortcut for S (Solve) when not typing inside an input element
    window.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        const isEditing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
        if (!isEditing && e.key.toLowerCase() === 's') {
            e.preventDefault();
            triggerSolve();
        }
    });

    // Load simple standard feedback loop on initial start to instantly demonstrate features
    loadTemplate('feedback');
});
