const STORAGE_KEY = 'storedSheetTable';
const DEFAULT_ELO = 1500;
const K = 32;

// UI State Management
let currentView = 'import';
let totalComparisons = 0;
let isLoading = false;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  // Hide splash screen after a short delay
  setTimeout(() => {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 300);
    }
  }, 1500);

  // Check for stored data
  const stored = loadFromLocal();
  if (stored.length > 0) {
    document.getElementById('nav').classList.remove('hidden');
    document.getElementById('fab').classList.remove('hidden');
    document.getElementById('progress-indicator').classList.remove('hidden');
    updateProgressIndicator();
    switchView('compare');
    pickNextComparison();
  } else {
    switchView('import');
  }

  // Add pull-to-refresh functionality
  addPullToRefresh();
  
  // Add keyboard navigation
  addKeyboardNavigation();
  
  // Add ripple effects to buttons
  addRippleEffects();
}

// Utility function to parse Google Sheets ID from URL
function parseSheetId(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Enhanced view switching with animations
function switchView(view) {
  if (currentView === view) return;
  
  // Hide all views
  const views = ['import', 'compare', 'rankings'];
  views.forEach(v => {
    const element = document.getElementById('view-' + v);
    if (element) {
      element.classList.add('hidden');
    }
  });
  
  // Show target view with animation
  const targetView = document.getElementById('view-' + view);
  if (targetView) {
    targetView.classList.remove('hidden');
    targetView.classList.add('fade-in');
  }
  
  // Update navigation state
  updateNavigation(view);
  currentView = view;
  
  // Update view-specific content
  if (view === 'rankings') {
    showRankings();
  } else if (view === 'compare') {
    updateProgressIndicator();
  }
}

// Update navigation button states
function updateNavigation(activeView) {
  const navButtons = document.querySelectorAll('.nav-button[data-view]');
  navButtons.forEach(button => {
    if (button.dataset.view === activeView) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

// Enhanced rankings display
function showRankings() {
  const items = loadFromLocal();
  updateDisplay(items);
}

function updateDisplay(items) {
  const container = document.getElementById('table-container');
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: rgba(0,0,0,0.6);">
        <span class="material-icons" style="font-size: 3rem; margin-bottom: 1rem; display: block;">inbox</span>
        <p>No data available</p>
      </div>
    `;
    return;
  }

  const sorted = [...items].sort((a, b) => b.score - a.score);
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // Create header
  const headerRow = document.createElement('tr');
  ['Rank', 'Name', 'Score', 'Wins', 'Losses', 'Comparisons'].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Create rows with ranking
  sorted.forEach((item, index) => {
    const tr = document.createElement('tr');
    
    // Rank column with medal icons for top 3
    const rankTd = document.createElement('td');
    if (index === 0) {
      rankTd.innerHTML = '<span class="material-icons" style="color: #ffd700;">emoji_events</span> 1';
    } else if (index === 1) {
      rankTd.innerHTML = '<span class="material-icons" style="color: #c0c0c0;">emoji_events</span> 2';
    } else if (index === 2) {
      rankTd.innerHTML = '<span class="material-icons" style="color: #cd7f32;">emoji_events</span> 3';
    } else {
      rankTd.textContent = index + 1;
    }
    tr.appendChild(rankTd);
    
    // Other columns
    [item.name, item.score.toFixed(0), item.wins, item.losses, item.comparisons].forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    });
    
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

// Local storage functions
function saveToLocal(items) {
  const data = { items, lastUpdated: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return data.items || [];
  } catch (e) {
    console.error('Error loading from localStorage:', e);
    return [];
  }
}

function clearData() {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    localStorage.removeItem(STORAGE_KEY);
    showToast('Data cleared successfully', 'success');
    setTimeout(() => {
      location.reload();
    }, 1000);
  }
}

// Enhanced sheet loading with better error handling and loading states
async function loadSheet() {
  const url = document.getElementById('sheet_url').value.trim();
  const sheetId = parseSheetId(url);
  
  if (!sheetId) {
    showToast('Invalid Google Sheets URL', 'error');
    return;
  }

  showLoadingOverlay(true);
  
  const queryUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
  
  try {
    const res = await fetch(queryUrl);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const text = await res.text();
    
    // Parse Google Sheets JSONP response
    const jsonStart = text.indexOf('(') + 1;
    const jsonEnd = text.lastIndexOf(')');
    const jsonText = text.slice(jsonStart, jsonEnd);
    const json = JSON.parse(jsonText);

    const headers = json.table.cols.map(col => (col.label || '').toLowerCase().trim());
    
    // Find column indices
    let nameIdx = headers.findIndex(h => 
      h === "name" || h === "names" || h === "item" || h === "items" || 
      h === "title" || h === "book" || h === "books"
    );
    let scoreIdx = headers.findIndex(h => h === "score" || h === "rating" || h === "elo");
    let winsIdx = headers.findIndex(h => h === "wins" || h === "win");
    let lossesIdx = headers.findIndex(h => h === "losses" || h === "loss" || h === "loses");
    let compIdx = headers.findIndex(h => h === "comparisons" || h === "comparison" || h === "comps");
    
    // Default to first column if no name column found
    if (nameIdx === -1) {
      nameIdx = 0;
    }

    const items = json.table.rows.map((r, i) => {
      const cells = r.c || [];
      
      let name = '';
      if (cells[nameIdx]) {
        name = String(cells[nameIdx].v || cells[nameIdx].f || '').trim();
      }
      
      if (!name) {
        name = `Item ${i + 1}`;
      }
      
      return {
        id: i,
        name: name,
        score: scoreIdx >= 0 && cells[scoreIdx] ? (parseFloat(cells[scoreIdx].v) || DEFAULT_ELO) : DEFAULT_ELO,
        wins: winsIdx >= 0 && cells[winsIdx] ? (parseInt(cells[winsIdx].v) || 0) : 0,
        losses: lossesIdx >= 0 && cells[lossesIdx] ? (parseInt(cells[lossesIdx].v) || 0) : 0,
        comparisons: compIdx >= 0 && cells[compIdx] ? (parseInt(cells[compIdx].v) || 0) : 0
      };
    });

    if (items.length === 0) {
      throw new Error('No data found in the spreadsheet');
    }

    saveToLocal(items);
    
    // Update UI
    document.getElementById('nav').classList.remove('hidden');
    document.getElementById('fab').classList.remove('hidden');
    document.getElementById('progress-indicator').classList.remove('hidden');
    
    updateProgressIndicator();
    switchView('compare');
    pickNextComparison();
    
    showToast(`Successfully loaded ${items.length} items`, 'success');
    
  } catch (error) {
    console.error('Error loading sheet:', error);
    showToast('Failed to load sheet. Please check the URL and permissions.', 'error');
  } finally {
    showLoadingOverlay(false);
  }
}

// Random pair selection with improved algorithm
function getRandomPair(items) {
  if (items.length < 2) return null;
  
  // Prefer items with fewer comparisons for more balanced ranking
  const sortedByComparisons = [...items].sort((a, b) => a.comparisons - b.comparisons);
  const minComparisons = sortedByComparisons[0].comparisons;
  const candidatesA = sortedByComparisons.filter(item => item.comparisons <= minComparisons + 2);
  
  let a = candidatesA[Math.floor(Math.random() * candidatesA.length)];
  let candidatesB = items.filter(item => item.id !== a.id);
  let b = candidatesB[Math.floor(Math.random() * candidatesB.length)];
  
  return [a, b];
}

// Enhanced comparison rendering
function renderComparison(a, b) {
  const container = document.getElementById('compare-container');
  container.innerHTML = '';
  
  const compareBox = document.createElement('div');
  compareBox.className = 'compare-box';
  
  // Create buttons with enhanced styling
  const button1 = createCompareButton(a, () => handleVote(a.id, b.id, button1));
  const button2 = createCompareButton(b, () => handleVote(b.id, a.id, button2));
  
  compareBox.appendChild(button1);
  compareBox.appendChild(button2);
  container.appendChild(compareBox);
  
  // Add fade-in animation
  compareBox.classList.add('fade-in');
}

function createCompareButton(item, clickHandler) {
  const button = document.createElement('button');
  button.textContent = item.name;
  button.dataset.id = item.id;
  button.addEventListener('click', clickHandler);
  
  // Add ripple effect
  button.addEventListener('click', function(e) {
    createRipple(e, this);
  });
  
  return button;
}

// Enhanced vote handling with better feedback
function handleVote(winnerId, loserId, el) {
  if (isLoading) return;
  
  // Immediate visual feedback
  if (el) {
    el.classList.add('button-pressed');
    el.blur();
    
    // Haptic feedback on supported devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => {
      if (el && el.classList) {
        el.classList.remove('button-pressed');
      }
    }, 200);
  }

  const items = loadFromLocal();
  const winner = items.find(i => i.id === winnerId);
  const loser = items.find(i => i.id === loserId);
  
  if (!winner || !loser) return;

  // Calculate Elo rating changes
  const EA = 1 / (1 + Math.pow(10, (loser.score - winner.score) / 400));
  const EB = 1 - EA;

  winner.score += K * (1 - EA);
  loser.score += K * (0 - EB);

  winner.wins++;
  loser.losses++;
  winner.comparisons++;
  loser.comparisons++;
  
  totalComparisons++;

  saveToLocal(items);
  updateProgressIndicator();
  
  // Show next comparison after delay
  setTimeout(() => {
    pickNextComparison();
  }, 300);
}

// Pick next comparison
function pickNextComparison() {
  const items = loadFromLocal();
  const pair = getRandomPair(items);
  if (!pair) {
    showToast('Need at least 2 items to compare', 'warning');
    return;
  }
  renderComparison(pair[0], pair[1]);
}

// Progress indicator
function updateProgressIndicator() {
  const items = loadFromLocal();
  const totalItems = items.length;
  const totalPossibleComparisons = totalItems * (totalItems - 1) / 2;
  const currentComparisons = items.reduce((sum, item) => sum + item.comparisons, 0) / 2;
  
  const progressPercent = totalPossibleComparisons > 0 ? 
    Math.min((currentComparisons / totalPossibleComparisons) * 100, 100) : 0;
  
  const progressFill = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');
  
  if (progressFill) {
    progressFill.style.width = `${progressPercent}%`;
  }
  
  if (progressText) {
    progressText.textContent = `${Math.floor(currentComparisons)} comparisons`;
  }
}

// Enhanced clipboard functionality
async function copyToClipboard() {
  const items = loadFromLocal().sort((a, b) => b.score - a.score);
  
  if (items.length === 0) {
    showToast('No data to copy', 'warning');
    return;
  }
  
  const headers = ['rank', 'name', 'score', 'wins', 'losses', 'comparisons'];
  const rows = [
    headers,
    ...items.map((item, index) => [
      index + 1,
      item.name,
      item.score.toFixed(1),
      item.wins,
      item.losses,
      item.comparisons
    ])
  ];
  
  const csv = rows.map(row => row.join('\t')).join('\n');
  
  try {
    await navigator.clipboard.writeText(csv);
    showToast('Rankings copied to clipboard!', 'success');
  } catch (err) {
    console.error('Failed to copy:', err);
    showToast('Failed to copy to clipboard', 'error');
  }
}

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, duration);
}

// Loading overlay
function showLoadingOverlay(show) {
  const overlay = document.getElementById('loading-overlay');
  if (!overlay) return;
  
  if (show) {
    overlay.classList.remove('hidden');
    isLoading = true;
  } else {
    overlay.classList.add('hidden');
    isLoading = false;
  }
}

// Ripple effect for buttons
function createRipple(event, element) {
  const circle = document.createElement('span');
  const diameter = Math.max(element.clientWidth, element.clientHeight);
  const radius = diameter / 2;
  
  const rect = element.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple');
  
  const ripple = element.getElementsByClassName('ripple')[0];
  if (ripple) {
    ripple.remove();
  }
  
  element.appendChild(circle);
}

// Add ripple effects to all buttons
function addRippleEffects() {
  const style = document.createElement('style');
  style.textContent = `
    .ripple {
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 600ms linear;
      background-color: rgba(255, 255, 255, 0.6);
    }
    
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Pull-to-refresh functionality
function addPullToRefresh() {
  let startY = 0;
  let currentY = 0;
  let pullDistance = 0;
  let isPulling = false;
  
  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
    }
  });
  
  document.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    
    currentY = e.touches[0].clientY;
    pullDistance = currentY - startY;
    
    if (pullDistance > 0 && pullDistance < 100) {
      e.preventDefault();
      document.body.style.transform = `translateY(${pullDistance * 0.5}px)`;
    }
  });
  
  document.addEventListener('touchend', () => {
    if (isPulling && pullDistance > 60) {
      // Trigger refresh
      pickNextComparison();
      showToast('Refreshed!', 'success');
    }
    
    // Reset
    document.body.style.transform = '';
    isPulling = false;
    pullDistance = 0;
  });
}

// Keyboard navigation
function addKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    if (currentView === 'compare') {
      const buttons = document.querySelectorAll('.compare-box button');
      if (buttons.length === 2) {
        if (e.key === '1' || e.key === 'ArrowLeft') {
          e.preventDefault();
          buttons[0].click();
        } else if (e.key === '2' || e.key === 'ArrowRight') {
          e.preventDefault();
          buttons[1].click();
        }
      }
    }
    
    // Navigation shortcuts
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      copyToClipboard();
    } else if (e.key === 'r' && e.ctrlKey) {
      e.preventDefault();
      switchView('rankings');
    } else if (e.key === 'Escape') {
      // Close any modals or return to compare view
      if (currentView !== 'compare') {
        switchView('compare');
      }
    }
  });
}

// Service Worker registration for PWA features
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Export functions for global access
window.loadSheet = loadSheet;
window.switchView = switchView;
window.copyToClipboard = copyToClipboard;
window.clearData = clearData;
window.pickNextComparison = pickNextComparison;