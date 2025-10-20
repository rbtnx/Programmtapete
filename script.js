class TileCanvas {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.addTileBtn = document.getElementById('addTileBtn');
        this.tileCounter = 0;
        this.draggedTile = null;
        this.dragOffset = { x: 0, y: 0 };
        this.activePopup = null;
        
        this.init();
    }
    
    init() {
        this.addTileBtn.addEventListener('click', () => this.addTile());
        this.setupDragAndDrop();
    }
    
    openThemenfeldPopup(anchorEl, onSelect) {
        // Close any existing popup
        if (this.activePopup) {
            this.activePopup.remove();
            this.activePopup = null;
        }
        const options = [
            'Themenfeld 1',
            'Themenfeld 2',
            'Themenfeld 3',
            'Themenfeld 4',
            'Themenfeld 5',
        ];
        const popup = document.createElement('div');
        popup.className = 'global-popup-menu';
        popup.tabIndex = -1;
        const list = document.createElement('div');
        list.className = 'global-popup-list';
        options.forEach(text => {
            const item = document.createElement('div');
            item.className = 'global-popup-item';
            item.textContent = text;
            item.addEventListener('mousedown', (e) => e.stopPropagation());
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                onSelect(text);
                this.closeActivePopup();
            });
            list.appendChild(item);
        });
        popup.appendChild(list);
        document.body.appendChild(popup);
        this.activePopup = popup;
        
        // Position near anchor
        const rect = anchorEl.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.left = `${rect.left}px`;
        popup.style.top = `${rect.bottom + 6}px`;
        
        const onDocClick = (e) => {
            if (!popup.contains(e.target)) {
                this.closeActivePopup();
                document.removeEventListener('click', onDocClick);
                document.removeEventListener('keydown', onKey);
            }
        };
        const onKey = (e) => {
            if (e.key === 'Escape') {
                this.closeActivePopup();
                document.removeEventListener('click', onDocClick);
                document.removeEventListener('keydown', onKey);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', onDocClick);
            document.addEventListener('keydown', onKey);
        }, 0);
    }
    
    closeActivePopup() {
        if (this.activePopup) {
            this.activePopup.remove();
            this.activePopup = null;
        }
    }
    
    addTile() {
        this.tileCounter++;
        const tile = this.createTileElement();
        this.canvas.appendChild(tile);
        
        // Position the new tile in the first available column
        //this.positionTileInFirstAvailableColumn(tile);

        const columnWidth = this.getColumnWidth();

        tile.style.position = 'absolute';
        tile.style.left = `calc(${columnWidth}px * 5)`;
        tile.style.top = '0';
        tile.style.width = `${columnWidth}px`;
    }
    
    createTileElement() {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.tileId = this.tileCounter;
        
        tile.innerHTML = `
            <div class="tile-content">
                <div class="tile-column titel">
                    <div class="tile-label">Titel</div>
                    <textarea class="tile-input" placeholder="Titel der Veranstaltung"></textarea>
                </div>
                <div class="tile-column themenfeld">
                    <div class="tile-label">Themenfeld</div>
                    <div class="themenfeld-select" tabindex="0">
                        <span class="themenfeld-value">Themenfeld</span>
                        <span class="themenfeld-caret">▾</span>
                    </div>
                </div>
                <div class="tile-column zielgruppe">
                    <div class="tile-label">Zielgruppe</div>
                    <div class="ziel-rows">
                        <div class="ziel-row" data-value="Kinder">Kinder</div>
                        <div class="ziel-row" data-value="Jugend">Jugend</div>
                        <div class="ziel-row" data-value="Erwachsene">Erwachsene</div>
                        <div class="ziel-row" data-value="Altersfreundlich">Altersfreundlich</div>
                        <div class="ziel-row" data-value="Schulklassen">Schulklassen</div>
                    </div>
                </div>
            </div>
            <button class="close-btn" onclick="tileCanvas.removeTile(this.parentElement)">×</button>
        `;
        
        // Attach interactions for themenfeld popup dropdown
        const themenfeld = tile.querySelector('.tile-column.themenfeld');
        const selectEl = themenfeld.querySelector('.themenfeld-select');
        const valueEl = themenfeld.querySelector('.themenfeld-value');

        // Prevent drag when interacting with dropdown trigger
        selectEl.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        selectEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openThemenfeldPopup(selectEl, (newValue) => {
                valueEl.textContent = newValue;
            });
        });

        // Attach click handlers for zielgruppe rows
        const zielRows = tile.querySelectorAll('.ziel-row');
        zielRows.forEach(row => {
            row.addEventListener('mousedown', (e) => {
                // prevent tile drag start when interacting with rows
                e.stopPropagation();
            });
            row.addEventListener('click', (e) => {
                e.stopPropagation();
                row.classList.toggle('active');
            });
        });
        
        return tile;
    }
    
    positionTileInFirstAvailableColumn(tile) {
        const columns = this.getColumnPositions();
        const tiles = Array.from(this.canvas.children).filter(child => child.classList.contains('tile'));
        
        // Find the column with the least tiles
        let columnCounts = new Array(6).fill(0);
        tiles.forEach(t => {
            const col = this.getTileColumn(t);
            if (col >= 0) columnCounts[col]++;
        });
        
        const targetColumn = columnCounts.indexOf(Math.min(...columnCounts));
        const columnLeft = columns[targetColumn];
        const columnWidth = this.getColumnWidth();
        
        tile.style.position = 'absolute';
        tile.style.left = `${columnLeft + 10}px`;
        tile.style.top = `${this.getNextPositionInColumn(targetColumn)}px`;
        tile.style.width = `${columnWidth - 20}px`;
    }
    
    getColumnPositions() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const columnWidth = canvasRect.width / 6;
        return Array.from({ length: 6 }, (_, i) => i * columnWidth);
    }
    
    getColumnWidth() {
        const canvasRect = this.canvas.getBoundingClientRect();
        return canvasRect.width / 6;
    }
    
    getTileColumn(tile) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const tileRect = tile.getBoundingClientRect();
        const columnWidth = canvasRect.width / 6;
        const relativeLeft = tileRect.left - canvasRect.left;
        return Math.floor(relativeLeft / columnWidth);
    }
    
    getNextPositionInColumn(columnIndex) {
        const tiles = Array.from(this.canvas.children).filter(child => 
            child.classList.contains('tile') && this.getTileColumn(child) === columnIndex
        );
        
        if (tiles.length === 0) return 20;
        
        // Sort tiles by their top position to find the bottommost tile
        tiles.sort((a, b) => {
            const aTop = parseInt(a.style.top) || 0;
            const bTop = parseInt(b.style.top) || 0;
            return aTop - bTop;
        });
        
        const lastTile = tiles[tiles.length - 1];
        const lastTileTop = parseInt(lastTile.style.top) || 0;
        const lastTileHeight = lastTile.offsetHeight;
        
        // Snap directly onto the tile above (no gap)
        return lastTileTop + lastTileHeight;
    }
    
    removeTile(tile) {
        tile.remove();
        this.reorganizeTiles();
    }
    
    reorganizeTiles() {
        const tiles = Array.from(this.canvas.children).filter(child => child.classList.contains('tile'));
        const columns = this.getColumnPositions();
        const columnWidth = this.getColumnWidth();
        
        // Group tiles by column
        const tilesByColumn = new Array(6).fill(null).map(() => []);
        
        tiles.forEach(tile => {
            const col = this.getTileColumn(tile);
            if (col >= 0 && col < 6) {
                tilesByColumn[col].push(tile);
            }
        });
        
        // Reposition tiles in each column
        tilesByColumn.forEach((columnTiles, columnIndex) => {
            let currentTop = 20;
            columnTiles.forEach(tile => {
                tile.style.position = 'absolute';
                tile.style.left = `${columns[columnIndex] + 10}px`;
                tile.style.top = `${currentTop}px`;
                tile.style.width = `${columnWidth - 20}px`;
                // Snap tiles together (no gap)
                currentTop += tile.offsetHeight;
            });
        });
    }
    
    reorganizeColumn(columnIndex) {
        if (columnIndex < 0 || columnIndex > 5) return;
        
        const tiles = Array.from(this.canvas.children).filter(child => child.classList.contains('tile'));
        const columns = this.getColumnPositions();
        const columnWidth = this.getColumnWidth();
        
        // Get tiles in the specific column
        const tilesInColumn = tiles.filter(tile => this.getTileColumn(tile) === columnIndex);
        
        // Sort tiles by their current top position
        tilesInColumn.sort((a, b) => {
            const aTop = parseInt(a.style.top) || 0;
            const bTop = parseInt(b.style.top) || 0;
            return aTop - bTop;
        });
        
        // Reposition tiles in the column
        let currentTop = 20;
        tilesInColumn.forEach(tile => {
            tile.style.position = 'absolute';
            tile.style.left = `${columns[columnIndex] + 10}px`;
            tile.style.top = `${currentTop}px`;
            tile.style.width = `${columnWidth - 20}px`;
            // Snap tiles together (no gap)
            currentTop += tile.offsetHeight;
        });
    }
    
    setupDragAndDrop() {
        this.canvas.addEventListener('mousedown', (e) => {
            // Find the tile element (either the target itself or its closest parent)
            const tile = e.target.closest('.tile');
            if (tile) {
                // Don't start drag if clicking on input elements or close button
                if (e.target.tagName === 'TEXTAREA' || 
                    e.target.tagName === 'INPUT' || 
                    e.target.classList.contains('close-btn') ||
                    e.target.closest('.close-btn')) {
                    return; // Allow normal interactions
                }
                
                e.preventDefault();
                this.startDrag(tile, e);
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.draggedTile) {
                e.preventDefault();
                this.dragMove(e);
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.draggedTile) {
                e.preventDefault();
                this.endDrag(e);
            }
        });
    }
    
    startDrag(tile, e) {
        this.draggedTile = tile;
        tile.classList.add('dragging');
        
        const rect = tile.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Store original position
        this.originalPosition = {
            left: tile.style.left,
            top: tile.style.top,
            column: this.getTileColumn(tile)
        };
        
        // Make tile follow mouse
        tile.style.position = 'fixed';
        tile.style.zIndex = '1000';
        tile.style.pointerEvents = 'none';
    }
    
    dragMove(e) {
        if (!this.draggedTile) return;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const columnWidth = canvasRect.width / 6;
        const mouseX = e.clientX - canvasRect.left;
        const targetColumn = Math.max(0, Math.min(5, Math.floor(mouseX / columnWidth)));
        
        // Update tile position to follow mouse
        this.draggedTile.style.left = `${e.clientX - this.dragOffset.x}px`;
        this.draggedTile.style.top = `${e.clientY - this.dragOffset.y}px`;
        
        // Highlight the target column
        this.highlightColumn(targetColumn);
    }
    
    endDrag(e) {
        if (!this.draggedTile) return;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const columnWidth = canvasRect.width / 6;
        const mouseX = e.clientX - canvasRect.left;
        const targetColumn = Math.max(0, Math.min(5, Math.floor(mouseX / columnWidth)));
        
        // Reset tile styles
        this.draggedTile.classList.remove('dragging');
        this.draggedTile.style.position = 'absolute';
        this.draggedTile.style.zIndex = '';
        this.draggedTile.style.pointerEvents = '';
        
        // Position the tile in the target column
        this.positionTileInColumn(this.draggedTile, targetColumn);
        this.removeColumnHighlight();
        
        // Reorganize affected columns
        setTimeout(() => {
            this.reorganizeColumn(this.originalPosition.column);
            if (this.originalPosition.column !== targetColumn) {
                this.reorganizeColumn(targetColumn);
            }
        }, 50);
        
        this.draggedTile = null;
        this.originalPosition = null;
    }
    
    highlightColumn(columnIndex) {
        this.removeColumnHighlight();
        
        // Ensure column index is within valid range
        if (columnIndex < 0 || columnIndex > 5) return;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const columnWidth = canvasRect.width / 6;
        const columnLeft = columnIndex * columnWidth;
        
        const highlight = document.createElement('div');
        highlight.className = 'drop-zone active';
        highlight.style.position = 'absolute';
        highlight.style.left = `${columnLeft}px`;
        highlight.style.top = '0';
        highlight.style.width = `${columnWidth}px`;
        highlight.style.height = '100%';
        highlight.style.pointerEvents = 'none';
        highlight.style.zIndex = '100';
        
        this.canvas.appendChild(highlight);
    }
    
    removeColumnHighlight() {
        const highlights = this.canvas.querySelectorAll('.drop-zone');
        highlights.forEach(highlight => highlight.remove());
    }
    
    positionTileInColumn(tile, columnIndex) {
        // Ensure column index is within valid range
        if (columnIndex < 0 || columnIndex > 5) return;
        
        const columns = this.getColumnPositions();
        const columnLeft = columns[columnIndex];
        const columnWidth = this.getColumnWidth();
        
        // Find the best position in the column (snap to existing tiles)
        const tilesInColumn = Array.from(this.canvas.children).filter(child => 
            child.classList.contains('tile') && 
            child !== tile && 
            this.getTileColumn(child) === columnIndex
        );
        
        let targetTop = 20;
        
        if (tilesInColumn.length > 0) {
            // Sort tiles by top position
            tilesInColumn.sort((a, b) => {
                const aTop = parseInt(a.style.top) || 0;
                const bTop = parseInt(b.style.top) || 0;
                return aTop - bTop;
            });
            
            // Find the best insertion point
            for (let i = 0; i < tilesInColumn.length; i++) {
                const currentTile = tilesInColumn[i];
                const currentTop = parseInt(currentTile.style.top) || 0;
                const currentHeight = currentTile.offsetHeight;
                
                if (i === 0 && targetTop + tile.offsetHeight < currentTop) {
                    break; // Insert at the top
                }
                
                if (i === tilesInColumn.length - 1) {
                    // Insert at the bottom - snap directly onto the last tile
                    targetTop = currentTop + currentHeight;
                } else {
                    const nextTile = tilesInColumn[i + 1];
                    const nextTop = parseInt(nextTile.style.top) || 0;
                    
                    if (targetTop + tile.offsetHeight < nextTop) {
                        break; // Insert between current and next
                    }
                    targetTop = currentTop + currentHeight;
                }
            }
        }
        
        tile.style.position = 'absolute';
        tile.style.left = `${columnLeft + 10}px`;
        tile.style.top = `${targetTop}px`;
        tile.style.width = `${columnWidth - 20}px`;
    }
}

// Initialize the tile canvas when the page loads
let tileCanvas;
document.addEventListener('DOMContentLoaded', () => {
    tileCanvas = new TileCanvas();
});
