// Load saved data when the page loads
let actions1 = JSON.parse(localStorage.getItem('actions1')) || [];
let actions2 = JSON.parse(localStorage.getItem('actions2')) || [];
let weeklyGoal1 = localStorage.getItem('weeklyGoal1') || '';
let weeklyGoal2 = localStorage.getItem('weeklyGoal2') || '';
let timeBlock1 = localStorage.getItem('timeBlock1') || '';
let timeBlock2 = localStorage.getItem('timeBlock2') || '';
let archivedGoals = JSON.parse(localStorage.getItem('archivedGoals')) || [];

// Set initial values
document.getElementById('weeklyGoal1').value = weeklyGoal1;
document.getElementById('weeklyGoal2').value = weeklyGoal2;
document.getElementById('timeBlock1').value = timeBlock1;
document.getElementById('timeBlock2').value = timeBlock2;
renderActions(1);
renderActions(2);
renderArchivedGoals();

// Add click handlers for complete buttons
document.getElementById('completeGoalBtn1').onclick = () => completeCurrentGoal(1);
document.getElementById('completeGoalBtn2').onclick = () => completeCurrentGoal(2);

function saveToLocalStorage() {
    localStorage.setItem('actions1', JSON.stringify(actions1));
    localStorage.setItem('actions2', JSON.stringify(actions2));
    localStorage.setItem('weeklyGoal1', document.getElementById('weeklyGoal1').value);
    localStorage.setItem('weeklyGoal2', document.getElementById('weeklyGoal2').value);
    localStorage.setItem('timeBlock1', document.getElementById('timeBlock1').value);
    localStorage.setItem('timeBlock2', document.getElementById('timeBlock2').value);
    localStorage.setItem('archivedGoals', JSON.stringify(archivedGoals));
}

function completeCurrentGoal(goalNum) {
    const currentGoal = document.getElementById(`weeklyGoal${goalNum}`).value;
    if (!currentGoal.trim()) {
        alert('Please enter a goal before completing it.');
        return;
    }

    const actions = goalNum === 1 ? actions1 : actions2;
    const timeBlock = document.getElementById(`timeBlock${goalNum}`).value;

    // Create archived goal object
    const archivedGoal = {
        goalNumber: goalNum,
        goal: currentGoal,
        actions: actions.filter(action => !action.completed),
        completedActions: actions.filter(action => action.completed),
        timeBlock: timeBlock,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now()
    };

    // Add to archived goals
    archivedGoals.unshift(archivedGoal);

    // Clear current goal and actions
    document.getElementById(`weeklyGoal${goalNum}`).value = '';
    if (goalNum === 1) {
        actions1 = [];
    } else {
        actions2 = [];
    }

    // Update UI and storage
    renderActions(goalNum);
    renderArchivedGoals();
    saveToLocalStorage();
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
        
        // Add completed actions
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
        
        // Add incomplete actions
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
        
        // Add time block if it exists
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
}

function toggleArchivedGoal(element) {
    element.classList.toggle('expanded');
}

function addAction(goalNum) {
    const input = document.getElementById(`newAction${goalNum}`);
    const text = input.value.trim();
    
    if (text) {
        const actions = goalNum === 1 ? actions1 : actions2;
        actions.push({
            text: text,
            completed: false
        });
        input.value = '';
        renderActions(goalNum);
        saveToLocalStorage();
    }
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

function renderActions(goalNum) {
    const actions = goalNum === 1 ? actions1 : actions2;
    const list = document.getElementById(`actionsList${goalNum}`);
    list.innerHTML = '';
    
    actions.forEach((action, index) => {
        const li = document.createElement('li');
        
        // Create checkbox
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

// Add save handlers for goals and time blocks
document.getElementById('weeklyGoal1').addEventListener('input', saveToLocalStorage);
document.getElementById('weeklyGoal2').addEventListener('input', saveToLocalStorage);
document.getElementById('timeBlock1').addEventListener('input', saveToLocalStorage);
document.getElementById('timeBlock2').addEventListener('input', saveToLocalStorage); 