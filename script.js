// Data management and storage utilities
const StorageManager = {
    compress: function(data) {
        try {
            return btoa(JSON.stringify(data));
        } catch (e) {
            console.error('Compression failed:', e);
            return null;
        }
    },

    decompress: function(compressedData) {
        try {
            return JSON.parse(atob(compressedData));
        } catch (e) {
            console.error('Decompression failed:', e);
            return null;
        }
    },

    save: function(key, data) {
        try {
            const compressedData = this.compress(data);
            if (compressedData) {
                localStorage.setItem(key, compressedData);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Save failed:', e);
            if (e.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Please clear some space by removing old archived goals.');
            }
            return false;
        }
    },

    load: function(key, defaultValue = null) {
        try {
            const compressedData = localStorage.getItem(key);
            if (!compressedData) return defaultValue;
            
            const data = this.decompress(compressedData);
            return data !== null ? data : defaultValue;
        } catch (e) {
            console.error('Load failed:', e);
            return defaultValue;
        }
    },

    backup: function() {
        const backup = {
            timestamp: new Date().toISOString(),
            data: {
                actions1,
                actions2,
                weeklyGoal1: document.getElementById('weeklyGoal1').value,
                weeklyGoal2: document.getElementById('weeklyGoal2').value,
                timeBlock1: document.getElementById('timeBlock1').value,
                timeBlock2: document.getElementById('timeBlock2').value,
                archivedGoals,
                statistics: getStatistics()
            }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gap-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Statistics tracking
function getStatistics() {
    return {
        totalGoalsCompleted: archivedGoals.length,
        totalActionsCompleted: archivedGoals.reduce((total, goal) => 
            total + (goal.completedActions ? goal.completedActions.length : 0), 0),
        totalActionsIncomplete: archivedGoals.reduce((total, goal) => 
            total + (goal.actions ? goal.actions.length : 0), 0),
        completionRate: archivedGoals.length > 0 ? 
            (archivedGoals.reduce((total, goal) => 
                total + (goal.completedActions ? goal.completedActions.length : 0), 0) /
            (archivedGoals.reduce((total, goal) => 
                total + (goal.completedActions ? goal.completedActions.length : 0) + 
                (goal.actions ? goal.actions.length : 0), 0)) * 100).toFixed(1) : 0
    };
}

// Load saved data when the page loads
let actions1 = StorageManager.load('actions1', []);
let actions2 = StorageManager.load('actions2', []);
let weeklyGoal1 = StorageManager.load('weeklyGoal1', '');
let weeklyGoal2 = StorageManager.load('weeklyGoal2', '');
let timeBlock1 = StorageManager.load('timeBlock1', '');
let timeBlock2 = StorageManager.load('timeBlock2', '');
let archivedGoals = StorageManager.load('archivedGoals', []);
let goalNotes1 = StorageManager.load('goalNotes1', '');
let goalNotes2 = StorageManager.load('goalNotes2', '');
let darkMode = StorageManager.load('darkMode', false);

// Set initial values
document.getElementById('weeklyGoal1').value = weeklyGoal1;
document.getElementById('weeklyGoal2').value = weeklyGoal2;
document.getElementById('timeBlock1').value = timeBlock1;
document.getElementById('timeBlock2').value = timeBlock2;
document.getElementById('goalNotes1').value = goalNotes1;
document.getElementById('goalNotes2').value = goalNotes2;

// Initialize dark mode
if (darkMode) {
    document.body.setAttribute('data-theme', 'dark');
    document.getElementById('darkModeToggle').textContent = '☀️ Light Mode';
}

// Dark mode toggle
document.getElementById('darkModeToggle').addEventListener('click', function() {
    darkMode = !darkMode;
    document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    this.textContent = darkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    StorageManager.save('darkMode', darkMode);
});

// Add notes handlers
document.getElementById('goalNotes1').addEventListener('input', function() {
    goalNotes1 = this.value;
    saveToLocalStorage();
});

document.getElementById('goalNotes2').addEventListener('input', function() {
    goalNotes2 = this.value;
    saveToLocalStorage();
});

function updateStatistics() {
    const stats = getStatistics();
    document.getElementById('totalGoalsCompleted').textContent = stats.totalGoalsCompleted;
    document.getElementById('totalActionsCompleted').textContent = stats.totalActionsCompleted;
    document.getElementById('completionRate').textContent = stats.completionRate + '%';
}

function addAction(goalNum) {
    const input = document.getElementById(`newAction${goalNum}`);
    const text = input.value.trim();
    
    if (text) {
        const actions = goalNum === 1 ? actions1 : actions2;
        actions.push({
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        });
        input.value = '';
        renderActions(goalNum);
        saveToLocalStorage();
    }
}

function completeCurrentGoal(goalNum) {
    const currentGoal = document.getElementById(`weeklyGoal${goalNum}`).value;
    if (!currentGoal.trim()) {
        alert('Please enter a goal before completing it.');
        return;
    }

    const actions = goalNum === 1 ? actions1 : actions2;
    const timeBlock = document.getElementById(`timeBlock${goalNum}`).value;
    const notes = document.getElementById(`goalNotes${goalNum}`).value;

    // Create archived goal object
    const archivedGoal = {
        goalNumber: goalNum,
        goal: currentGoal,
        actions: actions.filter(action => !action.completed),
        completedActions: actions.filter(action => action.completed),
        timeBlock: timeBlock,
        notes: notes,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now()
    };

    // Add to archived goals
    archivedGoals.unshift(archivedGoal);

    // Clear current goal and actions
    document.getElementById(`weeklyGoal${goalNum}`).value = '';
    document.getElementById(`goalNotes${goalNum}`).value = '';
    document.getElementById(`timeBlock${goalNum}`).value = '';
    if (goalNum === 1) {
        actions1 = [];
        goalNotes1 = '';
    } else {
        actions2 = [];
        goalNotes2 = '';
    }

    // Update UI and storage
    renderActions(goalNum);
    renderArchivedGoals();
    updateStatistics();
    saveToLocalStorage();
}

function renderActions(goalNum) {
    const actions = goalNum === 1 ? actions1 : actions2;
    const list = document.getElementById(`actionsList${goalNum}`);
    list.innerHTML = '';
    
    actions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    actions.forEach((action, index) => {
        const li = document.createElement('li');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = action.completed;
        checkbox.className = 'action-checkbox';
        checkbox.onclick = () => toggleComplete(goalNum, index);
        
        const textSpan = document.createElement('span');
        textSpan.textContent = action.text;
        if (action.completed) {
            textSpan.classList.add('completed');
        }
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => deleteAction(goalNum, index);
        
        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

function renderArchivedGoals() {
    const container = document.getElementById('archivedGoals');
    container.innerHTML = '';

    archivedGoals.forEach((archived, index) => {
        const goalElement = document.createElement('div');
        goalElement.className = 'archived-goal';
        
        const header = document.createElement('div');
        header.className = 'archived-goal-header';
        header.onclick = () => toggleArchivedGoal(goalElement);
        
        const title = document.createElement('div');
        title.className = 'archived-goal-title';
        title.textContent = archived.goal;
        
        const date = document.createElement('div');
        date.className = 'archived-goal-date';
        date.textContent = archived.date;
        
        header.appendChild(title);
        header.appendChild(date);
        
        const content = document.createElement('div');
        content.className = 'archived-goal-content';
        
        if (archived.notes) {
            const notesSection = document.createElement('div');
            notesSection.className = 'archived-notes';
            notesSection.innerHTML = `<h3>Notes:</h3><p>${archived.notes}</p>`;
            content.appendChild(notesSection);
        }
        
        if (archived.completedActions && archived.completedActions.length > 0) {
            const completedTitle = document.createElement('h3');
            completedTitle.textContent = 'Completed Actions:';
            content.appendChild(completedTitle);
            
            const completedList = document.createElement('ul');
            archived.completedActions.forEach(action => {
                const li = document.createElement('li');
                li.textContent = action.text;
                li.style.textDecoration = 'line-through';
                completedList.appendChild(li);
            });
            content.appendChild(completedList);
        }
        
        if (archived.actions && archived.actions.length > 0) {
            const incompleteTitle = document.createElement('h3');
            incompleteTitle.textContent = 'Incomplete Actions:';
            content.appendChild(incompleteTitle);
            
            const incompleteList = document.createElement('ul');
            archived.actions.forEach(action => {
                const li = document.createElement('li');
                li.textContent = action.text;
                incompleteList.appendChild(li);
            });
            content.appendChild(incompleteList);
        }
        
        if (archived.timeBlock) {
            const timeTitle = document.createElement('h3');
            timeTitle.textContent = 'Protected Time:';
            content.appendChild(timeTitle);
            
            const timeText = document.createElement('p');
            timeText.textContent = archived.timeBlock;
            content.appendChild(timeText);
        }
        
        goalElement.appendChild(header);
        goalElement.appendChild(content);
        container.appendChild(goalElement);
    });
    
    updateStatistics();
}

function toggleArchivedGoal(element) {
    element.classList.toggle('expanded');
}

function deleteAction(goalNum, index) {
    const actions = goalNum === 1 ? actions1 : actions2;
    actions.splice(index, 1);
    renderActions(goalNum);
    saveToLocalStorage();
}

function toggleComplete(goalNum, index) {
    const actions = goalNum === 1 ? actions1 : actions2;
    actions[index].completed = !actions[index].completed;
    renderActions(goalNum);
    saveToLocalStorage();
}

// Add enter key support for adding actions
document.getElementById('newAction1').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addAction(1);
    }
});

document.getElementById('newAction2').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addAction(2);
    }
});

// Add event listeners for Done buttons
document.getElementById('completeGoalBtn1').addEventListener('click', function() {
    completeCurrentGoal(1);
});

document.getElementById('completeGoalBtn2').addEventListener('click', function() {
    completeCurrentGoal(2);
});

// Add save handlers for goals and time blocks
document.getElementById('weeklyGoal1').addEventListener('input', saveToLocalStorage);
document.getElementById('weeklyGoal2').addEventListener('input', saveToLocalStorage);
document.getElementById('timeBlock1').addEventListener('input', saveToLocalStorage);
document.getElementById('timeBlock2').addEventListener('input', saveToLocalStorage);

function saveToLocalStorage() {
    StorageManager.save('actions1', actions1);
    StorageManager.save('actions2', actions2);
    StorageManager.save('weeklyGoal1', document.getElementById('weeklyGoal1').value);
    StorageManager.save('weeklyGoal2', document.getElementById('weeklyGoal2').value);
    StorageManager.save('timeBlock1', document.getElementById('timeBlock1').value);
    StorageManager.save('timeBlock2', document.getElementById('timeBlock2').value);
    StorageManager.save('archivedGoals', archivedGoals);
    StorageManager.save('goalNotes1', document.getElementById('goalNotes1').value);
    StorageManager.save('goalNotes2', document.getElementById('goalNotes2').value);
}

// Initialize the app
renderActions(1);
renderActions(2);
renderArchivedGoals();
updateStatistics(); 