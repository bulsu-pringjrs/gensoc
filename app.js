// Gender & Society Study App - Main JavaScript File

// Seed data for the application
const SEED_DATA = {
  "title": "Gender & Society – Quick Reviewer",
  "topics": [
    {
      "id": "wk13a",
      "title": "Cultural & Social Context of Gender",
      "summary": "Gender is socially constructed; culture shapes gender roles and expectations; gender socialization influences personality and behavior.",
      "flashcards": [
        {"q":"What is gender?","a":"A social and cultural construct describing norms, behaviors, and roles associated with being a woman, man, neither, or multiple genders."},
        {"q":"Name one way children learn gender roles.","a":"Through family, peers, media, and school — both directly and indirectly."},
        {"q":"What's the difference between gender norms and gender roles?","a":"Gender norms are expectations; gender roles are the behaviors assigned to those expectations."}
      ]
    },
    {
      "id": "wk11_12",
      "title": "Gender Pronouns & Inclusive Language",
      "summary": "Pronouns are part of gender expression; ask instead of assume; use correct pronouns; apologize briefly if you make a mistake.",
      "flashcards": [
        {"q":"Give three common pronouns.","a":"she/her/hers, he/him/his, they/them/theirs."},
        {"q":"How should you apologize after using the wrong pronoun?","a":"Briefly apologize, correct yourself, and move on (e.g., 'Sorry — I meant she')."},
        {"q":"Why avoid assuming pronouns?","a":"Assuming reinforces stereotypes and may misgender someone; ask to respect identity."}
      ]
    },
    {
      "id": "wk13b",
      "title": "Gender & Politics",
      "summary": "How gender shapes political participation and institutions; key laws and governance measures include the Magna Carta of Women.",
      "flashcards": [
        {"q":"What does gender and politics study?","a":"How political behavior, participation and institutions are influenced by gender identity and norms."},
        {"q":"Name one governance instrument in the Philippines that promotes gender equality.","a":"The Magna Carta of Women (RA 9710)."}
      ]
    },
    {
      "id": "wks14_16",
      "title": "Gender, Politics & Violence",
      "summary": "Philippine history of women's political involvement and laws protecting women (e.g., RA 7877, RA 7192); implementation gaps exist.",
      "flashcards": [
        {"q":"Name two laws protecting women in the Philippines.","a":"RA 7877 (Anti-Sexual Harassment, 1995) and RA 7192 (Women in Nation Building, 1991)."},
        {"q":"Give one historical example of women in Filipino resistance.","a":"Gabriela Silang — fought in the revolution and performed leadership roles."}
      ]
    }
  ],
  "schedule_recommendation":[
    {"time":"05:00","task":"Skim & orient (20 min)"},
    {"time":"05:20","task":"Cultural & Social Context — flashcards (50 min)"},
    {"time":"06:10","task":"Pronouns — flashcards + quiz (50 min)"},
    {"time":"07:00","task":"Break (10 min)"},
    {"time":"07:10","task":"Gender & Politics — flashcards + quiz (50 min)"},
    {"time":"08:00","task":"Gender, Politics & Violence — flashcards + essay bullets (45 min)"},
    {"time":"08:45","task":"Rapid final review (15 min)"}
  ]
};

// Application state management
class AppState {
  constructor() {
    this.currentView = 'home';
    this.currentTopic = null;
    this.currentFlashcardIndex = 0;
    this.currentQuizIndex = 0;
    this.quizQuestions = [];
    this.quizAnswers = [];
    this.studySession = null;
    this.timer = null;
    this.rapidReviewTimer = null;
    
    // Load user progress from localStorage
    this.loadProgress();
    
    // Initialize spaced repetition data if not exists
    this.initializeSpacedRepetition();
  }
  
  // LocalStorage management
  loadProgress() {
    try {
      const saved = localStorage.getItem('reviewer_progress');
      this.progress = saved ? JSON.parse(saved) : {
        completedFlashcards: {},
        quizScores: {},
        studyStreak: 0,
        lastStudyDate: null,
        totalStudyTime: 0
      };
      
      const userData = localStorage.getItem('reviewer_user');
      this.user = userData ? JSON.parse(userData) : {
        name: '',
        preferences: {
          theme: 'light',
          highContrast: false,
          pomodoroWork: 25,
          pomodoroBreak: 5
        }
      };
    } catch (error) {
      console.error('Error loading progress:', error);
      this.progress = {
        completedFlashcards: {},
        quizScores: {},
        studyStreak: 0,
        lastStudyDate: null,
        totalStudyTime: 0
      };
      this.user = {
        name: '',
        preferences: {
          theme: 'light',
          highContrast: false,
          pomodoroWork: 25,
          pomodoroBreak: 5
        }
      };
    }
  }
  
  saveProgress() {
    try {
      localStorage.setItem('reviewer_progress', JSON.stringify(this.progress));
      localStorage.setItem('reviewer_user', JSON.stringify(this.user));
    } catch (error) {
      console.error('Error saving progress:', error);
      showToast('Failed to save progress', 'error');
    }
  }
  
  // Initialize spaced repetition data structure
  initializeSpacedRepetition() {
    try {
      const saved = localStorage.getItem('reviewer_decks_v1');
      this.spacedRepetition = saved ? JSON.parse(saved) : {};
      
      // Initialize cards that don't exist in saved data
      SEED_DATA.topics.forEach(topic => {
        topic.flashcards.forEach((card, index) => {
          const cardId = `${topic.id}_${index}`;
          if (!this.spacedRepetition[cardId]) {
            this.spacedRepetition[cardId] = {
              easeFactor: 2.5,
              interval: 1,
              repetitions: 0,
              nextReview: Date.now(),
              lastReviewed: null,
              totalReviews: 0
            };
          }
        });
      });
      
      this.saveSpacedRepetition();
    } catch (error) {
      console.error('Error initializing spaced repetition:', error);
      this.spacedRepetition = {};
    }
  }
  
  saveSpacedRepetition() {
    try {
      localStorage.setItem('reviewer_decks_v1', JSON.stringify(this.spacedRepetition));
    } catch (error) {
      console.error('Error saving spaced repetition data:', error);
    }
  }
  
  // Spaced repetition algorithm (SuperMemo SM-2)
  updateSpacedRepetition(cardId, quality) {
    const card = this.spacedRepetition[cardId];
    if (!card) return;
    
    card.totalReviews++;
    card.lastReviewed = Date.now();
    
    if (quality >= 3) {
      // Correct answer
      if (card.repetitions === 0) {
        card.interval = 1;
      } else if (card.repetitions === 1) {
        card.interval = 6;
      } else {
        card.interval = Math.round(card.interval * card.easeFactor);
      }
      card.repetitions++;
    } else {
      // Incorrect answer - reset repetitions
      card.repetitions = 0;
      card.interval = 1;
    }
    
    // Update ease factor
    card.easeFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (card.easeFactor < 1.3) {
      card.easeFactor = 1.3;
    }
    
    // Set next review date
    card.nextReview = Date.now() + (card.interval * 24 * 60 * 60 * 1000);
    
    this.saveSpacedRepetition();
  }
  
  // Get cards due for review
  getDueCards() {
    const now = Date.now();
    const dueCards = [];
    
    SEED_DATA.topics.forEach(topic => {
      topic.flashcards.forEach((card, index) => {
        const cardId = `${topic.id}_${index}`;
        const spacedData = this.spacedRepetition[cardId];
        
        if (spacedData && spacedData.nextReview <= now) {
          dueCards.push({
            ...card,
            topicId: topic.id,
            topicTitle: topic.title,
            cardId: cardId,
            cardIndex: index,
            spacedData: spacedData
          });
        }
      });
    });
    
    return dueCards;
  }
}

// Initialize app state
const appState = new AppState();

// Utility functions
function getTopicImage(topicId) {
  const imageMap = {
    'wk13a': 'https://source.unsplash.com/800x400/?gender,culture,society',
    'wk11_12': 'https://source.unsplash.com/800x400/?language,communication,identity',
    'wk13b': 'https://source.unsplash.com/800x400/?politics,government,equality',
    'wks14_16': 'https://source.unsplash.com/800x400/?philippines,history,women'
  };
  return imageMap[topicId] || 'https://source.unsplash.com/800x400/?education,study';
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => container.removeChild(toast), 300);
  }, 3000);
}

function showModal(content) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  
  body.innerHTML = content;
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  
  // Focus management
  const firstFocusable = overlay.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) {
    firstFocusable.focus();
  }
}

function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
}

// Quiz generator with distractors
function generateQuizQuestions(topicId = null, count = 5) {
  let allCards = [];
  
  if (topicId) {
    const topic = SEED_DATA.topics.find(t => t.id === topicId);
    if (topic) {
      allCards = topic.flashcards.map(card => ({
        ...card,
        topicTitle: topic.title
      }));
    }
  } else {
    // All topics
    SEED_DATA.topics.forEach(topic => {
      topic.flashcards.forEach(card => {
        allCards.push({
          ...card,
          topicTitle: topic.title
        });
      });
    });
  }
  
  // Shuffle and select questions
  const shuffled = allCards.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  
  // Generate multiple choice questions
  return selected.map(card => {
    const correctAnswer = card.a;
    const distractors = generateDistractors(correctAnswer, allCards.map(c => c.a));
    
    const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(correctAnswer);
    
    return {
      question: card.q,
      options: options,
      correctIndex: correctIndex,
      explanation: correctAnswer,
      topicTitle: card.topicTitle
    };
  });
}

function generateDistractors(correctAnswer, allAnswers) {
  // Simple distractor generation - pick random answers from other cards
  const otherAnswers = allAnswers.filter(a => a !== correctAnswer);
  const shuffled = otherAnswers.sort(() => Math.random() - 0.5);
  
  // Generate 3 distractors
  const distractors = shuffled.slice(0, 3);
  
  // If we don't have enough, generate some generic ones
  while (distractors.length < 3) {
    distractors.push(`Alternative answer ${distractors.length + 1}`);
  }
  
  return distractors;
}

// Timer management
class Timer {
  constructor(duration, onTick, onComplete) {
    this.duration = duration;
    this.remaining = duration;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.interval = null;
    this.isRunning = false;
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.remaining--;
      this.onTick(this.remaining);
      
      if (this.remaining <= 0) {
        this.stop();
        this.onComplete();
      }
    }, 1000);
  }
  
  pause() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    clearInterval(this.interval);
  }
  
  stop() {
    this.isRunning = false;
    clearInterval(this.interval);
  }
  
  reset() {
    this.stop();
    this.remaining = this.duration;
    this.onTick(this.remaining);
  }
}

// View rendering functions
function renderHome() {
  const dueCards = appState.getDueCards();
  const totalCards = SEED_DATA.topics.reduce((sum, topic) => sum + topic.flashcards.length, 0);
  
  return `
    <div class="home-view">
      <div class="welcome-section">
        <h1>Welcome to Gender & Society Reviewer</h1>
        <p>Master key concepts through interactive flashcards, quizzes, and spaced repetition learning.</p>
        
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;">
          <div class="stat-card card">
            <div class="card-body" style="text-align: center;">
              <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${dueCards.length}</div>
              <div style="color: var(--text-secondary);">Cards Due</div>
            </div>
          </div>
          <div class="stat-card card">
            <div class="card-body" style="text-align: center;">
              <div style="font-size: 2rem; font-weight: bold; color: var(--success-color);">${totalCards}</div>
              <div style="color: var(--text-secondary);">Total Cards</div>
            </div>
          </div>
          <div class="stat-card card">
            <div class="card-body" style="text-align: center;">
              <div style="font-size: 2rem; font-weight: bold; color: var(--warning-color);">${appState.progress.studyStreak}</div>
              <div style="color: var(--text-secondary);">Study Streak</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="topics-grid">
        ${SEED_DATA.topics.map(topic => `
          <div class="topic-card card">
            <img src="${getTopicImage(topic.id)}" alt="${topic.title}" class="topic-image" loading="lazy">
            <div class="topic-content">
              <h3 class="topic-title">${topic.title}</h3>
              <p class="topic-summary">${topic.summary}</p>
              <div class="topic-actions">
                <button class="btn btn-primary" onclick="showTopic('${topic.id}')">
                  📖 Open Topic
                </button>
                <button class="btn btn-secondary" onclick="startFlashcards('${topic.id}')">
                  🎴 Study Cards
                </button>
                <button class="btn btn-secondary" onclick="startQuiz('${topic.id}')">
                  🧠 Quick Quiz
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="quick-actions" style="margin-top: 2rem;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Quick Actions</h3>
          </div>
          <div class="card-body">
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <button class="btn btn-primary" onclick="startRapidReview()">
                ⚡ Rapid Review (15 min)
              </button>
              <button class="btn btn-secondary" onclick="showView('study-timer')">
                ⏱️ Study Timer
              </button>
              <button class="btn btn-secondary" onclick="showView('progress')">
                📊 View Progress
              </button>
              <button class="btn btn-secondary" onclick="exportProgress()">
                💾 Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTopic(topicId) {
  const topic = SEED_DATA.topics.find(t => t.id === topicId);
  if (!topic) return '<div>Topic not found</div>';
  
  const topicCards = topic.flashcards.map((card, index) => {
    const cardId = `${topicId}_${index}`;
    const spacedData = appState.spacedRepetition[cardId];
    const nextReview = spacedData ? new Date(spacedData.nextReview).toLocaleDateString() : 'Never';
    const isDue = spacedData ? spacedData.nextReview <= Date.now() : true;
    
    return `
      <div class="flashcard-summary card" style="margin-bottom: 1rem;">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <strong style="color: var(--text-primary);">${card.q}</strong>
            <span class="review-status" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 4px; ${isDue ? 'background-color: var(--warning-color); color: white;' : 'background-color: var(--success-color); color: white;'}">
              ${isDue ? 'Due Now' : `Next: ${nextReview}`}
            </span>
          </div>
          <div style="color: var(--text-secondary); font-style: italic;">${card.a}</div>
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="topic-view">
      <div class="topic-header" style="margin-bottom: 2rem;">
        <img src="${getTopicImage(topicId)}" alt="${topic.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--border-radius-lg); margin-bottom: 1rem;" loading="lazy">
        <h1>${topic.title}</h1>
        <p style="font-size: var(--font-size-lg); color: var(--text-secondary); margin-bottom: 1.5rem;">${topic.summary}</p>
        
        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="startFlashcards('${topicId}')">
            🎴 Study Flashcards
          </button>
          <button class="btn btn-secondary" onclick="startQuiz('${topicId}')">
            🧠 Take Quiz
          </button>
          <button class="btn btn-secondary" onclick="showView('home')">
            ← Back to Home
          </button>
        </div>
      </div>
      
      <div class="flashcards-overview">
        <h2>Flashcards Overview</h2>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
          Review the questions and answers for this topic. Cards marked "Due Now" should be studied first.
        </p>
        ${topicCards}
      </div>
    </div>
  `;
}

function renderFlashcards(topicId) {
  const topic = SEED_DATA.topics.find(t => t.id === topicId);
  if (!topic) return '<div>Topic not found</div>';
  
  const currentCard = topic.flashcards[appState.currentFlashcardIndex];
  const cardId = `${topicId}_${appState.currentFlashcardIndex}`;
  const progress = `${appState.currentFlashcardIndex + 1} / ${topic.flashcards.length}`;
  
  return `
    <div class="flashcards-view">
      <div class="flashcard-header" style="text-align: center; margin-bottom: 2rem;">
        <h2>${topic.title}</h2>
        <div class="flashcard-progress">${progress}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${((appState.currentFlashcardIndex + 1) / topic.flashcards.length) * 100}%"></div>
        </div>
      </div>
      
      <div class="flashcard-container">
        <div class="flashcard" id="current-flashcard">
          <div class="flashcard-inner">
            <div class="flashcard-front">
              <div class="flashcard-text">${currentCard.q}</div>
              <div style="position: absolute; bottom: 1rem; right: 1rem; font-size: 0.875rem; color: var(--text-muted);">
                Click to reveal answer
              </div>
            </div>
            <div class="flashcard-back">
              <div class="flashcard-text">${currentCard.a}</div>
            </div>
          </div>
        </div>
        
        <div class="flashcard-controls">
          <button class="btn btn-error" onclick="rateFlashcard('${cardId}', 1)">
            😞 I didn't know
          </button>
          <button class="btn btn-warning" onclick="rateFlashcard('${cardId}', 3)">
            🤔 I guessed
          </button>
          <button class="btn btn-success" onclick="rateFlashcard('${cardId}', 5)">
            😊 I knew it
          </button>
        </div>
        
        <div style="text-align: center; margin-top: 1.5rem;">
          <button class="btn btn-secondary" onclick="showTopic('${topicId}')">
            ← Back to Topic
          </button>
          <button class="btn btn-secondary" onclick="showView('home')" style="margin-left: 1rem;">
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderQuiz(topicId) {
  if (appState.quizQuestions.length === 0) {
    appState.quizQuestions = generateQuizQuestions(topicId, 5);
    appState.quizAnswers = new Array(appState.quizQuestions.length).fill(null);
    appState.currentQuizIndex = 0;
  }
  
  const currentQuestion = appState.quizQuestions[appState.currentQuizIndex];
  const progress = `${appState.currentQuizIndex + 1} / ${appState.quizQuestions.length}`;
  const isAnswered = appState.quizAnswers[appState.currentQuizIndex] !== null;
  const selectedAnswer = appState.quizAnswers[appState.currentQuizIndex];
  
  return `
    <div class="quiz-view">
      <div class="quiz-header" style="text-align: center; margin-bottom: 2rem;">
        <h2>Quiz${topicId ? `: ${SEED_DATA.topics.find(t => t.id === topicId)?.title}` : ''}</h2>
        <div class="quiz-progress">${progress}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${((appState.currentQuizIndex + 1) / appState.quizQuestions.length) * 100}%"></div>
        </div>
      </div>
      
      <div class="quiz-container">
        <div class="quiz-question">
          <div class="question-text">${currentQuestion.question}</div>
          <div class="quiz-options">
            ${currentQuestion.options.map((option, index) => {
              let className = 'quiz-option';
              if (isAnswered) {
                if (index === currentQuestion.correctIndex) {
                  className += ' correct';
                } else if (index === selectedAnswer && index !== currentQuestion.correctIndex) {
                  className += ' incorrect';
                }
              } else if (index === selectedAnswer) {
                className += ' selected';
              }
              
              return `
                <div class="${className}" onclick="${isAnswered ? '' : `selectQuizAnswer(${index})`}" 
                     style="${isAnswered ? 'cursor: default;' : 'cursor: pointer;'}">
                  <span style="font-weight: bold; margin-right: 0.5rem;">${String.fromCharCode(65 + index)}.</span>
                  ${option}
                </div>
              `;
            }).join('')}
          </div>
          
          ${isAnswered ? `
            <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--bg-tertiary); border-radius: var(--border-radius);">
              <strong>Explanation:</strong> ${currentQuestion.explanation}
            </div>
          ` : ''}
        </div>
        
        <div class="quiz-controls">
          <div>
            ${appState.currentQuizIndex > 0 ? `
              <button class="btn btn-secondary" onclick="previousQuizQuestion()">← Previous</button>
            ` : ''}
          </div>
          
          <div>
            ${!isAnswered && selectedAnswer !== null ? `
              <button class="btn btn-primary" onclick="submitQuizAnswer()">Submit Answer</button>
            ` : ''}
            
            ${isAnswered && appState.currentQuizIndex < appState.quizQuestions.length - 1 ? `
              <button class="btn btn-primary" onclick="nextQuizQuestion()">Next →</button>
            ` : ''}
            
            ${isAnswered && appState.currentQuizIndex === appState.quizQuestions.length - 1 ? `
              <button class="btn btn-success" onclick="finishQuiz()">Finish Quiz</button>
            ` : ''}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 1.5rem;">
          <button class="btn btn-secondary" onclick="exitQuiz()">Exit Quiz</button>
        </div>
      </div>
    </div>
  `;
}

function renderQuizResults() {
  const correctAnswers = appState.quizAnswers.filter((answer, index) => 
    answer === appState.quizQuestions[index].correctIndex
  ).length;
  
  const score = Math.round((correctAnswers / appState.quizQuestions.length) * 100);
  const passed = score >= 70;
  
  // Save quiz score
  const topicId = appState.currentTopic || 'all';
  if (!appState.progress.quizScores[topicId]) {
    appState.progress.quizScores[topicId] = [];
  }
  appState.progress.quizScores[topicId].push({
    score: score,
    date: new Date().toISOString(),
    questionsTotal: appState.quizQuestions.length,
    questionsCorrect: correctAnswers
  });
  appState.saveProgress();
  
  return `
    <div class="quiz-results">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2>Quiz Complete!</h2>
        <div style="font-size: 3rem; margin: 1rem 0;">
          ${passed ? '🎉' : '📚'}
        </div>
        <div style="font-size: 2rem; font-weight: bold; color: ${passed ? 'var(--success-color)' : 'var(--warning-color)'};">
          ${score}%
        </div>
        <div style="color: var(--text-secondary);">
          ${correctAnswers} out of ${appState.quizQuestions.length} correct
        </div>
        <div style="margin-top: 1rem; color: var(--text-secondary);">
          ${passed ? 'Great job! You passed!' : 'Keep studying and try again!'}
        </div>
      </div>
      
      <div class="results-breakdown">
        <h3>Question Review</h3>
        ${appState.quizQuestions.map((question, index) => {
          const userAnswer = appState.quizAnswers[index];
          const isCorrect = userAnswer === question.correctIndex;
          
          return `
            <div class="result-item card" style="margin-bottom: 1rem;">
              <div class="card-body">
                <div style="display: flex; align-items: start; gap: 1rem;">
                  <div style="font-size: 1.5rem;">
                    ${isCorrect ? '✅' : '❌'}
                  </div>
                  <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 0.5rem;">
                      ${question.question}
                    </div>
                    <div style="color: var(--text-secondary); margin-bottom: 0.5rem;">
                      Your answer: ${question.options[userAnswer] || 'Not answered'}
                    </div>
                    ${!isCorrect ? `
                      <div style="color: var(--success-color);">
                        Correct answer: ${question.options[question.correctIndex]}
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div style="text-align: center; margin-top: 2rem;">
        <button class="btn btn-primary" onclick="retakeQuiz()">
          🔄 Retake Quiz
        </button>
        <button class="btn btn-secondary" onclick="showView('home')" style="margin-left: 1rem;">
          🏠 Back to Home
        </button>
      </div>
    </div>
  `;
}

function renderRapidReview() {
  const dueCards = appState.getDueCards();
  const allCards = [];
  
  SEED_DATA.topics.forEach(topic => {
    topic.flashcards.forEach((card, index) => {
      allCards.push({
        ...card,
        topicId: topic.id,
        topicTitle: topic.title,
        cardId: `${topic.id}_${index}`,
        cardIndex: index
      });
    });
  });
  
  const reviewCards = dueCards.length > 0 ? dueCards : allCards.sort(() => Math.random() - 0.5).slice(0, 15);
  
  return `
    <div class="rapid-review">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2>Rapid Review</h2>
        <p style="color: var(--text-secondary);">
          Quick 15-minute review session across all topics
        </p>
        
        <div class="timer-display" id="rapid-timer">15:00</div>
        <div class="progress-bar">
          <div class="progress-fill" id="rapid-progress" style="width: 0%"></div>
        </div>
      </div>
      
      <div class="rapid-review-content">
        ${reviewCards.length > 0 ? `
          <div class="card">
            <div class="card-body" style="text-align: center;">
              <h3>Ready to start?</h3>
              <p>We've prepared ${reviewCards.length} cards for your rapid review session.</p>
              <button class="btn btn-primary btn-lg" onclick="startRapidReviewSession()">
                ⚡ Start 15-Minute Review
              </button>
            </div>
          </div>
        ` : `
          <div class="card">
            <div class="card-body" style="text-align: center;">
              <h3>No cards available</h3>
              <p>All your cards are up to date! Come back later for more review.</p>
              <button class="btn btn-secondary" onclick="showView('home')">
                🏠 Back to Home
              </button>
            </div>
          </div>
        `}
      </div>
      
      <div style="text-align: center; margin-top: 2rem;">
        <button class="btn btn-secondary" onclick="showView('home')">
          ← Back to Home
        </button>
      </div>
    </div>
  `;
}

function renderStudyTimer() {
  return `
    <div class="study-timer">
      <div class="timer-container">
        <h2>Study Timer</h2>
        <p style="color: var(--text-secondary); text-align: center; margin-bottom: 2rem;">
          Use the Pomodoro technique to stay focused during study sessions
        </p>
        
        <div class="timer-display" id="study-timer-display">25:00</div>
        
        <div class="timer-controls">
          <button class="btn btn-success" id="timer-start" onclick="startStudyTimer()">
            ▶️ Start
          </button>
          <button class="btn btn-warning" id="timer-pause" onclick="pauseStudyTimer()" style="display: none;">
            ⏸️ Pause
          </button>
          <button class="btn btn-secondary" id="timer-reset" onclick="resetStudyTimer()">
            🔄 Reset
          </button>
        </div>
        
        <div class="timer-settings">
          <div class="timer-setting">
            <label for="work-duration">Work Duration (minutes)</label>
            <input type="number" id="work-duration" min="1" max="60" value="${appState.user.preferences.pomodoroWork}">
          </div>
          <div class="timer-setting">
            <label for="break-duration">Break Duration (minutes)</label>
            <input type="number" id="break-duration" min="1" max="30" value="${appState.user.preferences.pomodoroBreak}">
          </div>
        </div>
        
        <div class="schedule-recommendation card" style="margin-top: 2rem;">
          <div class="card-header">
            <h3 class="card-title">Recommended Study Schedule</h3>
          </div>
          <div class="card-body">
            ${SEED_DATA.schedule_recommendation.map(item => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                <strong>${item.time}</strong>
                <span style="color: var(--text-secondary);">${item.task}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 2rem;">
        <button class="btn btn-secondary" onclick="showView('home')">
          ← Back to Home
        </button>
      </div>
    </div>
  `;
}

function renderProgress() {
  const totalCards = SEED_DATA.topics.reduce((sum, topic) => sum + topic.flashcards.length, 0);
  const reviewedCards = Object.keys(appState.spacedRepetition).filter(cardId => 
    appState.spacedRepetition[cardId].totalReviews > 0
  ).length;
  
  const completionRate = totalCards > 0 ? Math.round((reviewedCards / totalCards) * 100) : 0;
  
  return `
    <div class="progress-view">
      <h2>Your Progress</h2>
      
      <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;">
        <div class="stat-card card">
          <div class="card-body" style="text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${completionRate}%</div>
            <div style="color: var(--text-secondary);">Completion Rate</div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="card-body" style="text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: var(--success-color);">${reviewedCards}</div>
            <div style="color: var(--text-secondary);">Cards Reviewed</div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="card-body" style="text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: var(--warning-color);">${appState.progress.studyStreak}</div>
            <div style="color: var(--text-secondary);">Study Streak</div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="card-body" style="text-align: center;">
            <div style="font-size: 2rem; font-weight: bold; color: var(--secondary-color);">${Math.round(appState.progress.totalStudyTime / 60)}</div>
            <div style="color: var(--text-secondary);">Minutes Studied</div>
          </div>
        </div>
      </div>
      
      <div class="topic-progress">
        <h3>Progress by Topic</h3>
        ${SEED_DATA.topics.map(topic => {
          const topicCards = topic.flashcards.length;
          const topicReviewed = topic.flashcards.filter((_, index) => {
            const cardId = `${topic.id}_${index}`;
            return appState.spacedRepetition[cardId] && appState.spacedRepetition[cardId].totalReviews > 0;
          }).length;
          const topicProgress = topicCards > 0 ? Math.round((topicReviewed / topicCards) * 100) : 0;
          
          return `
            <div class="topic-progress-item card" style="margin-bottom: 1rem;">
              <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <h4 style="margin: 0;">${topic.title}</h4>
                  <span style="font-weight: bold; color: var(--primary-color);">${topicProgress}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${topicProgress}%"></div>
                </div>
                <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
                  ${topicReviewed} of ${topicCards} cards reviewed
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="quiz-history" style="margin-top: 2rem;">
        <h3>Quiz History</h3>
        ${Object.keys(appState.progress.quizScores).length > 0 ? `
          ${Object.entries(appState.progress.quizScores).map(([topicId, scores]) => {
            const topicTitle = topicId === 'all' ? 'All Topics' : 
              SEED_DATA.topics.find(t => t.id === topicId)?.title || topicId;
            const avgScore = scores.length > 0 ? 
              Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : 0;
            
            return `
              <div class="quiz-history-item card" style="margin-bottom: 1rem;">
                <div class="card-body">
                  <h4>${topicTitle}</h4>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Average Score: <strong>${avgScore}%</strong></span>
                    <span style="color: var(--text-secondary);">${scores.length} attempt${scores.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        ` : `
          <div class="card">
            <div class="card-body" style="text-align: center; color: var(--text-secondary);">
              No quiz attempts yet. Take a quiz to see your progress!
            </div>
          </div>
        `}
      </div>
      
      <div style="text-align: center; margin-top: 2rem;">
        <button class="btn btn-primary" onclick="exportProgress()">
          💾 Export Progress
        </button>
        <button class="btn btn-secondary" onclick="showView('home')" style="margin-left: 1rem;">
          ← Back to Home
        </button>
      </div>
    </div>
  `;
}

function renderPrintView() {
  const topFlashcards = [];
  
  SEED_DATA.topics.forEach(topic => {
    topic.flashcards.forEach((card, index) => {
      const cardId = `${topic.id}_${index}`;
      const spacedData = appState.spacedRepetition[cardId];
      
      topFlashcards.push({
        ...card,
        topicTitle: topic.title,
        reviews: spacedData ? spacedData.totalReviews : 0,
        difficulty: spacedData ? (6 - spacedData.easeFactor) : 3
      });
    });
  });
  
  // Sort by difficulty and review count
  topFlashcards.sort((a, b) => (b.difficulty + (b.reviews * 0.1)) - (a.difficulty + (a.reviews * 0.1)));
  const top10Cards = topFlashcards.slice(0, 10);
  
  return `
    <div class="print-view">
      <h2>Study Notes & Cheat Sheet</h2>
      <p style="color: var(--text-secondary); margin-bottom: 2rem;">
        Printable summary of key concepts and your most challenging flashcards
      </p>
      
      <div class="print-content">
        <div class="topics-summary">
          <h3>Topic Summaries</h3>
          ${SEED_DATA.topics.map(topic => `
            <div class="topic-summary-item" style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--border-radius);">
              <h4 style="color: var(--primary-color); margin-bottom: 0.5rem;">${topic.title}</h4>
              <p>${topic.summary}</p>
            </div>
          `).join('')}
        </div>
        
        <div class="top-flashcards" style="margin-top: 2rem;">
          <h3>Top 10 Key Concepts</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">
            Based on difficulty and review frequency
          </p>
          ${top10Cards.map((card, index) => `
            <div class="print-flashcard" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: var(--border-radius);">
              <div style="display: flex; align-items: start; gap: 1rem;">
                <div style="font-weight: bold; color: var(--primary-color); min-width: 2rem;">${index + 1}.</div>
                <div style="flex: 1;">
                  <div style="font-weight: bold; margin-bottom: 0.5rem;">${card.q}</div>
                  <div style="color: var(--text-secondary); margin-bottom: 0.5rem;">${card.a}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                    Topic: ${card.topicTitle} | Reviews: ${card.reviews}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 2rem;">
        <button class="btn btn-primary" onclick="printNotes()">
          🖨️ Print / Save as PDF
        </button>
        <button class="btn btn-secondary" onclick="showView('home')" style="margin-left: 1rem;">
          ← Back to Home
        </button>
      </div>
    </div>
  `;
}

// Event handlers and navigation
function showView(viewName) {
  appState.currentView = viewName;
  appState.currentTopic = null;
  
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    item.setAttribute('tabindex', '-1');
  });
  
  const activeNav = document.querySelector(`[data-view="${viewName}"]`);
  if (activeNav) {
    activeNav.classList.add('active');
    activeNav.setAttribute('tabindex', '0');
  }
  
  // Render content
  const contentArea = document.getElementById('content-area');
  
  switch (viewName) {
    case 'home':
      contentArea.innerHTML = renderHome();
      break;
    case 'rapid-review':
      contentArea.innerHTML = renderRapidReview();
      break;
    case 'study-timer':
      contentArea.innerHTML = renderStudyTimer();
      break;
    case 'progress':
      contentArea.innerHTML = renderProgress();
      break;
    case 'print':
      contentArea.innerHTML = renderPrintView();
      break;
    default:
      contentArea.innerHTML = renderHome();
  }
  
  // Close mobile menu
  document.querySelector('.sidebar').classList.remove('open');
}

function showTopic(topicId) {
  appState.currentView = 'topic';
  appState.currentTopic = topicId;
  
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = renderTopic(topicId);
}

function startFlashcards(topicId) {
  appState.currentView = 'flashcards';
  appState.currentTopic = topicId;
  appState.currentFlashcardIndex = 0;
  
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = renderFlashcards(topicId);
  
  // Add flip functionality
  setTimeout(() => {
    const flashcard = document.getElementById('current-flashcard');
    if (flashcard) {
      flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flipped');
      });
    }
  }, 100);
}

function rateFlashcard(cardId, quality) {
  // Update spaced repetition
  appState.updateSpacedRepetition(cardId, quality);
  
  // Move to next card
  const topic = SEED_DATA.topics.find(t => t.id === appState.currentTopic);
  if (appState.currentFlashcardIndex < topic.flashcards.length - 1) {
    appState.currentFlashcardIndex++;
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = renderFlashcards(appState.currentTopic);
    
    // Re-add flip functionality
    setTimeout(() => {
      const flashcard = document.getElementById('current-flashcard');
      if (flashcard) {
        flashcard.addEventListener('click', () => {
          flashcard.classList.toggle('flipped');
        });
      }
    }, 100);
  } else {
    // Session complete
    showToast('Flashcard session complete!', 'success');
    showTopic(appState.currentTopic);
  }
  
  // Update study streak
  const today = new Date().toDateString();
  if (appState.progress.lastStudyDate !== today) {
    appState.progress.studyStreak++;
    appState.progress.lastStudyDate = today;
    appState.saveProgress();
  }
}

function startQuiz(topicId = null) {
  appState.currentView = 'quiz';
  appState.currentTopic = topicId;
  appState.quizQuestions = [];
  appState.quizAnswers = [];
  appState.currentQuizIndex = 0;
  
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = renderQuiz(topicId);
}

function selectQuizAnswer(answerIndex) {
  appState.quizAnswers[appState.currentQuizIndex] = answerIndex;
  
  // Update UI
  document.querySelectorAll('.quiz-option').forEach((option, index) => {
    option.classList.remove('selected');
    if (index === answerIndex) {
      option.classList.add('selected');
    }
  });
  
  // Re-render to show submit button
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = renderQuiz(appState.currentTopic);
}

function submitQuizAnswer() {
  // Re-render to show explanation and next button
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = renderQuiz(appState.currentTopic);
}

function nextQuizQuestion() {
  appState.currentQuizIndex++;
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = renderQuiz(appState.currentTopic);
}

function previousQuizQuestion() {
  appState.currentQuizIndex--;
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = renderQuiz(appState.currentTopic);
}

function finishQuiz() {
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = renderQuizResults();
}

function retakeQuiz() {
  appState.quizQuestions = [];
  appState.quizAnswers = [];
  appState.currentQuizIndex = 0;
  startQuiz(appState.currentTopic);
}

function exitQuiz() {
  appState.quizQuestions = [];
  appState.quizAnswers = [];
  if (appState.currentTopic) {
    showTopic(appState.currentTopic);
  } else {
    showView('home');
  }
}

function startRapidReview() {
  showView('rapid-review');
}

function startRapidReviewSession() {
  const dueCards = appState.getDueCards();
  const allCards = [];
  
  SEED_DATA.topics.forEach(topic => {
    topic.flashcards.forEach((card, index) => {
      allCards.push({
        ...card,
        topicId: topic.id,
        topicTitle: topic.title,
        cardId: `${topic.id}_${index}`,
        cardIndex: index
      });
    });
  });
  
  const reviewCards = dueCards.length > 0 ? dueCards : allCards.sort(() => Math.random() - 0.5).slice(0, 15);
  
  // Start 15-minute timer
  let timeRemaining = 15 * 60; // 15 minutes in seconds
  let currentCardIndex = 0;
  
  const timerDisplay = document.getElementById('rapid-timer');
  const progressBar = document.getElementById('rapid-progress');
  
  appState.rapidReviewTimer = setInterval(() => {
    timeRemaining--;
    timerDisplay.textContent = formatTime(timeRemaining);
    
    if (timeRemaining <= 0) {
      clearInterval(appState.rapidReviewTimer);
      showToast('Rapid review session complete!', 'success');
      showView('home');
      return;
    }
  }, 1000);
  
  // Show first card
  showRapidReviewCard(reviewCards, currentCardIndex);
}

function showRapidReviewCard(cards, index) {
  if (index >= cards.length) {
    clearInterval(appState.rapidReviewTimer);
    showToast('All cards reviewed!', 'success');
    showView('home');
    return;
  }
  
  const card = cards[index];
  const progress = ((index + 1) / cards.length) * 100;
  
  document.getElementById('rapid-progress').style.width = `${progress}%`;
  
  const content = `
    <div class="rapid-card-container" style="max-width: 600px; margin: 0 auto;">
      <div class="card-info" style="text-align: center; margin-bottom: 1rem; color: var(--text-secondary);">
        ${card.topicTitle} • Card ${index + 1} of ${cards.length}
      </div>
      
      <div class="flashcard" id="rapid-flashcard">
        <div class="flashcard-inner">
          <div class="flashcard-front">
            <div class="flashcard-text">${card.q}</div>
            <div style="position: absolute; bottom: 1rem; right: 1rem; font-size: 0.875rem; color: var(--text-muted);">
              Click to reveal
            </div>
          </div>
          <div class="flashcard-back">
            <div class="flashcard-text">${card.a}</div>
          </div>
        </div>
      </div>
      
      <div class="rapid-controls" style="display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem;">
        <button class="btn btn-primary" onclick="nextRapidCard(${index + 1})">
          Next Card →
        </button>
        <button class="btn btn-secondary" onclick="endRapidReview()">
          End Session
        </button>
      </div>
    </div>
  `;
  
  document.querySelector('.rapid-review-content').innerHTML = content;
  
  // Add flip functionality
  setTimeout(() => {
    const flashcard = document.getElementById('rapid-flashcard');
    if (flashcard) {
      flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flipped');
      });
    }
  }, 100);
}

function nextRapidCard(nextIndex) {
  const dueCards = appState.getDueCards();
  const allCards = [];
  
  SEED_DATA.topics.forEach(topic => {
    topic.flashcards.forEach((card, index) => {
      allCards.push({
        ...card,
        topicId: topic.id,
        topicTitle: topic.title,
        cardId: `${topic.id}_${index}`,
        cardIndex: index
      });
    });
  });
  
  const reviewCards = dueCards.length > 0 ? dueCards : allCards.sort(() => Math.random() - 0.5).slice(0, 15);
  showRapidReviewCard(reviewCards, nextIndex);
}

function endRapidReview() {
  if (appState.rapidReviewTimer) {
    clearInterval(appState.rapidReviewTimer);
  }
  showView('home');
}

// Study timer functions
function startStudyTimer() {
  const workDuration = parseInt(document.getElementById('work-duration').value) * 60;
  const breakDuration = parseInt(document.getElementById('break-duration').value) * 60;
  
  // Save preferences
  appState.user.preferences.pomodoroWork = workDuration / 60;
  appState.user.preferences.pomodoroBreak = breakDuration / 60;
  appState.saveProgress();
  
  // Start work timer
  appState.timer = new Timer(
    workDuration,
    (remaining) => {
      document.getElementById('study-timer-display').textContent = formatTime(remaining);
    },
    () => {
      showToast('Work session complete! Time for a break.', 'success');
      // Auto-start break timer
      startBreakTimer();
    }
  );
  
  appState.timer.start();
  
  // Update UI
  document.getElementById('timer-start').style.display = 'none';
  document.getElementById('timer-pause').style.display = 'inline-flex';
  
  // Track study time
  const startTime = Date.now();
  appState.studyStartTime = startTime;
}

function startBreakTimer() {
  const breakDuration = parseInt(document.getElementById('break-duration').value) * 60;
  
  appState.timer = new Timer(
    breakDuration,
    (remaining) => {
      document.getElementById('study-timer-display').textContent = formatTime(remaining);
    },
    () => {
      showToast('Break time over! Ready for another work session?', 'success');
      resetStudyTimer();
    }
  );
  
  appState.timer.start();
}

function pauseStudyTimer() {
  if (appState.timer) {
    appState.timer.pause();
  }
  
  // Update UI
  document.getElementById('timer-start').style.display = 'inline-flex';
  document.getElementById('timer-pause').style.display = 'none';
  
  // Update study time
  if (appState.studyStartTime) {
    const studyTime = Math.floor((Date.now() - appState.studyStartTime) / 1000);
    appState.progress.totalStudyTime += studyTime;
    appState.saveProgress();
  }
}

function resetStudyTimer() {
  if (appState.timer) {
    appState.timer.stop();
  }
  
  const workDuration = parseInt(document.getElementById('work-duration').value) * 60;
  document.getElementById('study-timer-display').textContent = formatTime(workDuration);
  
  // Update UI
  document.getElementById('timer-start').style.display = 'inline-flex';
  document.getElementById('timer-pause').style.display = 'none';
  
  // Update study time
  if (appState.studyStartTime) {
    const studyTime = Math.floor((Date.now() - appState.studyStartTime) / 1000);
    appState.progress.totalStudyTime += studyTime;
    appState.saveProgress();
    appState.studyStartTime = null;
  }
}

// Export and print functions
function exportProgress() {
  const exportData = {
    progress: appState.progress,
    spacedRepetition: appState.spacedRepetition,
    user: appState.user,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `gender-society-progress-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  showToast('Progress exported successfully!', 'success');
}

function printNotes() {
  // Prepare print content
  const topFlashcards = [];
  
  SEED_DATA.topics.forEach(topic => {
    topic.flashcards.forEach((card, index) => {
      const cardId = `${topic.id}_${index}`;
      const spacedData = appState.spacedRepetition[cardId];
      
      topFlashcards.push({
        ...card,
        topicTitle: topic.title,
        reviews: spacedData ? spacedData.totalReviews : 0,
        difficulty: spacedData ? (6 - spacedData.easeFactor) : 3
      });
    });
  });
  
  topFlashcards.sort((a, b) => (b.difficulty + (b.reviews * 0.1)) - (a.difficulty + (a.reviews * 0.1)));
  const top10Cards = topFlashcards.slice(0, 10);
  
  const printContent = `
    <div class="print-header">
      <h1>Gender & Society - Study Notes</h1>
      <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="print-section">
      <h2>Topic Summaries</h2>
      ${SEED_DATA.topics.map(topic => `
        <div class="topic-summary">
          <h3>${topic.title}</h3>
          <p>${topic.summary}</p>
        </div>
      `).join('')}
    </div>
    
    <div class="print-section">
      <h2>Top 10 Key Concepts</h2>
      ${top10Cards.map((card, index) => `
        <div class="print-flashcard">
          <div class="print-question">${index + 1}. ${card.q}</div>
          <div class="print-answer">${card.a}</div>
          <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
            Topic: ${card.topicTitle} | Reviews: ${card.reviews}
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="print-section">
      <h2>Study Schedule Recommendation</h2>
      ${SEED_DATA.schedule_recommendation.map(item => `
        <div style="margin-bottom: 10px;">
          <strong>${item.time}</strong> - ${item.task}
        </div>
      `).join('')}
    </div>
  `;
  
  document.getElementById('print-content').innerHTML = printContent;
  window.print();
}

// Theme and accessibility functions
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  
  // Update icon
  const themeIcon = document.querySelector('.theme-icon');
  themeIcon.textContent = newTheme === 'light' ? '🌙' : '☀️';
  
  // Save preference
  appState.user.preferences.theme = newTheme;
  appState.saveProgress();
  
  showToast(`Switched to ${newTheme} theme`, 'success');
}

function toggleAccessibility() {
  const currentContrast = document.documentElement.getAttribute('data-contrast') || 'normal';
  const newContrast = currentContrast === 'normal' ? 'high' : 'normal';
  
  document.documentElement.setAttribute('data-contrast', newContrast);
  
  // Save preference
  appState.user.preferences.highContrast = newContrast === 'high';
  appState.saveProgress();
  
  showToast(`${newContrast === 'high' ? 'Enabled' : 'Disabled'} high contrast mode`, 'success');
}

// Initialize the application
function initializeApp() {
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', appState.user.preferences.theme);
  document.querySelector('.theme-icon').textContent = appState.user.preferences.theme === 'light' ? '🌙' : '☀️';
  
  // Apply accessibility settings
  if (appState.user.preferences.highContrast) {
    document.documentElement.setAttribute('data-contrast', 'high');
  }
  
  // Populate topics navigation
  const topicsNav = document.getElementById('topics-nav');
  topicsNav.innerHTML = SEED_DATA.topics.map(topic => `
    <li role="none">
      <button class="nav-item" onclick="showTopic('${topic.id}')" role="menuitem" tabindex="-1">
        <span class="nav-icon">📚</span>
        <span class="nav-text">${topic.title}</span>
      </button>
    </li>
  `).join('');
  
  // Set up event listeners
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
  });
  
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('accessibility-toggle').addEventListener('click', toggleAccessibility);
  
  // Modal close functionality
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      hideModal();
    }
  });
  
  document.querySelector('.modal-close').addEventListener('click', hideModal);
  
  // Navigation event listeners
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const view = e.currentTarget.getAttribute('data-view');
      if (view) {
        showView(view);
      }
    });
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
      hideModal();
    }
    
    // Arrow key navigation for nav items
    if (e.target.classList.contains('nav-item')) {
      const navItems = Array.from(document.querySelectorAll('.nav-item'));
      const currentIndex = navItems.indexOf(e.target);
      
      if (e.key === 'ArrowDown' && currentIndex < navItems.length - 1) {
        e.preventDefault();
        navItems[currentIndex + 1].focus();
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        navItems[currentIndex - 1].focus();
      }
    }
  });
  
  // Initialize with home view
  showView('home');
  
  console.log('Gender & Society Study App initialized successfully!');
}

// Make functions globally accessible for onclick handlers
window.showView = showView;
window.showTopic = showTopic;
window.startFlashcards = startFlashcards;
window.startQuiz = startQuiz;
window.startRapidReview = startRapidReview;
window.startRapidReviewSession = startRapidReviewSession;
window.nextRapidCard = nextRapidCard;
window.endRapidReview = endRapidReview;
window.rateFlashcard = rateFlashcard;
window.selectQuizAnswer = selectQuizAnswer;
window.submitQuizAnswer = submitQuizAnswer;
window.nextQuizQuestion = nextQuizQuestion;
window.previousQuizQuestion = previousQuizQuestion;
window.finishQuiz = finishQuiz;
window.retakeQuiz = retakeQuiz;
window.exitQuiz = exitQuiz;
window.startStudyTimer = startStudyTimer;
window.pauseStudyTimer = pauseStudyTimer;
window.resetStudyTimer = resetStudyTimer;
window.exportProgress = exportProgress;
window.printNotes = printNotes;
window.toggleTheme = toggleTheme;
window.toggleAccessibility = toggleAccessibility;

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);