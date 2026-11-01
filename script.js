/* ==========================================================================
   MetaAI Fit – AI-Powered Personalized Fitness & Wellness Platform
   Script: script.js
   Description: Complete client-side functionality including localStorage
                authentication, AI assessment logic, dashboard tab navigation,
                interactive widgets, AI Coach chatbot, and profile management.
   ========================================================================== */

// --- 1. DEFAULT DATA & LOCAL STORAGE INITIALIZATION ---
const DEFAULT_USER = {
  name: "Bhavya",
  email: "bhavya@metaaifit.com",
  age: 22,
  gender: "Female",
  height: 165,
  weight: 60,
  fitnessLevel: "Intermediate",
  fitnessGoal: "Improve Fitness",
  activityLevel: "Moderately Active",
  availableTime: "45-60 mins",
  dietPreference: "Vegetarian",
  fitnessScore: 82,
  workoutsCompleted: 12,
  activeGoals: 8,
  badgesEarned: 5,
  burnedCalories: 420,
  targetCalories: 600,
  steps: 7842,
  targetSteps: 10000,
  water: 1.8,
  targetWater: 3.0,
  sleep: 7.5,
  targetSleep: 8.0,
  sleepQuality: 88,
  stressScore: 24,
  mood: "Great",
  nutrition: {
    consumedKcal: 1640,
    targetKcal: 2100,
    protein: 120,
    proteinTarget: 150,
    carbs: 180,
    carbsTarget: 230,
    fats: 48,
    fatsTarget: 65,
    loggedMeals: [
      { id: 1, type: "Breakfast", name: "Oatmeal & Fruits", kcal: 380, protein: 14, time: "08:30 AM" },
      { id: 2, type: "Lunch", name: "Rice & Grilled Vegetables", kcal: 560, protein: 28, time: "01:15 PM" },
      { id: 3, type: "Snacks", name: "Greek Yogurt & Almonds", kcal: 180, protein: 12, time: "04:45 PM" }
    ]
  },
  workouts: [
    { id: 1, name: "Full Body Strength", difficulty: "Intermediate", duration: "45 min", calories: "360 kcal", progress: 60 },
    { id: 2, name: "Cardio Training", difficulty: "Beginner", duration: "30 min", calories: "280 kcal", progress: 80 },
    { id: 3, name: "Core Workout", difficulty: "All Levels", duration: "20 min", calories: "180 kcal", progress: 40 },
    { id: 4, name: "Stretching & Mobility", difficulty: "Beginner", duration: "15 min", calories: "90 kcal", progress: 100 },
    { id: 5, name: "Athletic Conditioning", difficulty: "Advanced", duration: "35 min", calories: "420 kcal", progress: 20 }
  ]
};

// Get current user from localStorage or set default
function getUserData() {
  const stored = localStorage.getItem("metaai_user");
  if (!stored) {
    localStorage.setItem("metaai_user", JSON.stringify(DEFAULT_USER));
    return DEFAULT_USER;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!parsed.nutrition) {
      parsed.nutrition = JSON.parse(JSON.stringify(DEFAULT_USER.nutrition));
    }
    if (parsed.sleepQuality === undefined) {
      parsed.sleepQuality = DEFAULT_USER.sleepQuality;
    }
    if (parsed.stressScore === undefined) {
      parsed.stressScore = DEFAULT_USER.stressScore;
    }
    // Clean up any legacy workout #5 if cached in localStorage
    if (parsed.workouts) {
      parsed.workouts.forEach(w => {
        if (w.id === 5) {
          w.name = "Athletic Conditioning";
        }
      });
    }
    return parsed;
  } catch (e) {
    return DEFAULT_USER;
  }
}

// Save user data to localStorage
function saveUserData(data) {
  localStorage.setItem("metaai_user", JSON.stringify(data));
  if (data && data.email) {
    const emailKey = `metaai_user_${data.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    try {
      localStorage.setItem(emailKey, JSON.stringify(data));
    } catch (e) {}
  }
}

// Check login status
function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true";
}

// Set login status
function setLoggedIn(state) {
  localStorage.setItem("isLoggedIn", state ? "true" : "false");
}

// --- 2. GLOBAL TOAST NOTIFICATION UTILITY ---
function showToast(message, type = "success") {
  let toast = document.getElementById("global-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "global-toast";
    toast.className = "toast-notice";
    document.body.appendChild(toast);
  }
  
  const icon = type === "success" ? "✓" : "ℹ";
  toast.innerHTML = `<span style="color:#48C78E;font-weight:bold;">${icon}</span> <span>${message}</span>`;
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

// --- 3. PAGE INITIALIZATION & AUTH GUARD ---
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;
  const isDashboardPage = currentPath.includes("dashboard.html");
  
  // Dashboard Auth Guard
  if (isDashboardPage) {
    if (!isLoggedIn()) {
      // User is not logged in: redirect to landing page
      window.location.href = "index.html";
      return;
    }
    initDashboardPage();
  } else {
    // Landing Page
    initLandingPage();
  }
});

// --- 4. LANDING PAGE FUNCTIONALITY ---
function initLandingPage() {
  // Mobile Nav Toggle
  const hamburgerBtn = document.getElementById("hamburger-btn");
  const navLinks = document.getElementById("nav-links");
  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // Update hero score if custom user exists
  const user = getUserData();
  const heroScoreNum = document.getElementById("hero-score-num");
  if (heroScoreNum && user.fitnessScore) {
    heroScoreNum.textContent = user.fitnessScore;
    const ringBar = document.getElementById("hero-ring-bar");
    if (ringBar) {
      const offset = 440 - (440 * (user.fitnessScore / 100));
      ringBar.style.strokeDashoffset = offset;
    }
  }

  // Check if already logged in -> update Navbar button
  const navLoginBtn = document.getElementById("nav-login-btn");
  if (navLoginBtn && isLoggedIn()) {
    navLoginBtn.textContent = "Go to Dashboard →";
    navLoginBtn.onclick = () => {
      window.location.href = "dashboard.html";
    };
  }

  // Assessment Form Handling
  const assessmentForm = document.getElementById("ai-assessment-form");
  if (assessmentForm) {
    assessmentForm.addEventListener("submit", handleAssessmentSubmit);
  }

  // Login Form Handling
  const loginForm = document.getElementById("modal-login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  // Signup Form Handling
  const signupForm = document.getElementById("modal-signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignupSubmit);
  }

  // Contact Form Handling
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Thank you for reaching out! Our team will contact you shortly.");
      contactForm.reset();
    });
  }

  // Standalone BMI & BMR Calculator Setup (Real-time & instant)
  initStandaloneCalculator();
}

// Standalone Calculator Logic
function initStandaloneCalculator() {
  const ageInp = document.getElementById("sc-age");
  const genderInp = document.getElementById("sc-gender");
  const heightInp = document.getElementById("sc-height");
  const weightInp = document.getElementById("sc-weight");
  const activityInp = document.getElementById("sc-activity");

  if (!ageInp || !heightInp || !weightInp) return;

  // Recalculate on any input change in real time
  [ageInp, genderInp, heightInp, weightInp, activityInp].forEach(el => {
    if (el) {
      el.addEventListener("input", calculateStandaloneBiometrics);
      el.addEventListener("change", calculateStandaloneBiometrics);
    }
  });

  // Initial calculation on load
  calculateStandaloneBiometrics();
}

function calculateStandaloneBiometrics() {
  const age = parseInt(document.getElementById("sc-age")?.value) || 22;
  const gender = document.getElementById("sc-gender")?.value || "Female";
  const height = parseFloat(document.getElementById("sc-height")?.value) || 165;
  const weight = parseFloat(document.getElementById("sc-weight")?.value) || 60;
  const activityMultiplier = parseFloat(document.getElementById("sc-activity")?.value) || 1.55;

  if (height <= 0 || weight <= 0) return;

  // 1. BMI Calculation
  const heightM = height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);

  // BMI Category & Spectrum Pin position (percentage across spectrum bar)
  let category = "Normal Weight";
  let badgeClass = "badge-green";
  let pinPercent = 45;

  if (bmi < 18.5) {
    category = "Underweight";
    badgeClass = "badge-blue";
    pinPercent = Math.max(8, Math.min(22, (bmi / 18.5) * 22));
  } else if (bmi <= 24.9) {
    category = "Normal Weight";
    badgeClass = "badge-green";
    pinPercent = 25 + (((bmi - 18.5) / 6.4) * 30);
  } else if (bmi <= 29.9) {
    category = "Overweight";
    badgeClass = "badge-amber";
    pinPercent = 58 + (((bmi - 25.0) / 4.9) * 20);
  } else {
    category = "Obese";
    badgeClass = "badge-purple";
    pinPercent = Math.min(94, 82 + (((bmi - 30.0) / 10) * 12));
  }

  // 2. BMR Calculation (Mifflin-St Jeor formula)
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr = (gender === "Male") ? Math.round(bmr + 5) : Math.round(bmr - 161);

  // 3. TDEE (Maintenance Calories)
  const tdee = Math.round(bmr * activityMultiplier);

  // 4. Calorie Tiers
  const cutCalories = Math.max(1200, Math.round(tdee - 450));
  const bulkCalories = Math.round(tdee + 300);

  // Update DOM Elements
  const bmiValEl = document.getElementById("sc-bmi-value");
  const bmiCatEl = document.getElementById("sc-bmi-category");
  const bmiPinEl = document.getElementById("sc-bmi-pin");
  const bmrValEl = document.getElementById("sc-bmr-val");
  const tdeeValEl = document.getElementById("sc-tdee-val");
  const cutValEl = document.getElementById("sc-cut-val");
  const maintValEl = document.getElementById("sc-maint-val");
  const bulkValEl = document.getElementById("sc-bulk-val");

  if (bmiValEl) bmiValEl.textContent = bmi;
  if (bmiCatEl) {
    bmiCatEl.textContent = category;
    bmiCatEl.className = `badge ${badgeClass}`;
  }
  if (bmiPinEl) bmiPinEl.style.left = `${pinPercent}%`;
  if (bmrValEl) bmrValEl.textContent = bmr.toLocaleString();
  if (tdeeValEl) tdeeValEl.textContent = tdee.toLocaleString();
  if (cutValEl) cutValEl.textContent = `${cutCalories.toLocaleString()} kcal`;
  if (maintValEl) maintValEl.textContent = `${tdee.toLocaleString()} kcal`;
  if (bulkValEl) bulkValEl.textContent = `${bulkCalories.toLocaleString()} kcal`;
}

// Modal open/close helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

// Switch between Login and Signup modals
function switchToSignup() {
  closeModal("login-modal");
  openModal("signup-modal");
}

function switchToLogin() {
  closeModal("signup-modal");
  openModal("login-modal");
}

// Handle AI Assessment Form Submission
function handleAssessmentSubmit(e) {
  e.preventDefault();
  
  const age = parseInt(document.getElementById("assess-age").value) || 22;
  const gender = document.getElementById("assess-gender").value;
  const height = parseFloat(document.getElementById("assess-height").value) || 165;
  const weight = parseFloat(document.getElementById("assess-weight").value) || 60;
  const fitnessLevel = document.getElementById("assess-level").value;
  const fitnessGoal = document.getElementById("assess-goal").value;
  const activityLevel = document.getElementById("assess-activity").value;
  const availableTime = document.getElementById("assess-time").value;
  const dietaryPref = document.getElementById("assess-diet").value;

  // 1. Calculate BMI
  const heightM = height / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);

  // 2. Calculate Basal Metabolic Rate (BMR) via Mifflin-St Jeor Formula
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr = (gender === "Male") ? bmr + 5 : bmr - 161;

  // 3. Multiplier for Activity Level
  let activityMultiplier = 1.375;
  if (activityLevel === "Sedentary") activityMultiplier = 1.2;
  else if (activityLevel === "Lightly Active") activityMultiplier = 1.375;
  else if (activityLevel === "Moderately Active") activityMultiplier = 1.55;
  else if (activityLevel === "Very Active") activityMultiplier = 1.725;

  let tdee = Math.round(bmr * activityMultiplier);

  // Adjust for Goal
  let targetCalories = tdee;
  let recommendedWorkout = "Full-Body Strength & Cardio Circuit";

  if (fitnessGoal === "Weight Loss") {
    targetCalories = Math.round(tdee - 450);
    recommendedWorkout = "Cardio Endurance & Core Conditioning";
  } else if (fitnessGoal === "Muscle Gain") {
    targetCalories = Math.round(tdee + 350);
    recommendedWorkout = "Hypertrophy Push-Pull-Legs Split";
  } else if (fitnessGoal === "Increase Strength") {
    targetCalories = Math.round(tdee + 250);
    recommendedWorkout = "Compound Strength & Heavy Resistance Routine";
  } else if (fitnessGoal === "Improve Health") {
    targetCalories = tdee;
    recommendedWorkout = "Balanced Mobility, Aerobics & Functional Fitness";
  }

  // 4. Calculate Water Requirement: approx 35ml per kg
  const waterTarget = ((weight * 0.035)).toFixed(1);

  // 5. Calculate AI Fitness Score (balanced between 75 and 95)
  let calculatedScore = 80;
  if (fitnessLevel === "Advanced") calculatedScore += 8;
  else if (fitnessLevel === "Intermediate") calculatedScore += 4;
  if (activityLevel === "Very Active") calculatedScore += 4;
  calculatedScore = Math.min(96, Math.max(72, calculatedScore));

  // Update current user record in localStorage
  const currentUser = getUserData();
  const updatedUser = {
    ...currentUser,
    age,
    gender,
    height,
    weight,
    fitnessLevel,
    fitnessGoal,
    activityLevel,
    availableTime,
    dietPreference: dietaryPref,
    fitnessScore: calculatedScore,
    targetCalories
  };
  saveUserData(updatedUser);

  // Display results in the modal
  document.getElementById("res-score").textContent = calculatedScore;
  document.getElementById("res-workout").textContent = recommendedWorkout;
  document.getElementById("res-calories").textContent = `${targetCalories} kcal / day`;
  document.getElementById("res-water").textContent = `${waterTarget} Liters / day`;
  document.getElementById("res-activity").textContent = `${availableTime} / day (${activityLevel})`;

  const resultContainer = document.getElementById("assessment-result-container");
  if (resultContainer) {
    resultContainer.style.display = "block";
    resultContainer.scrollIntoView({ behavior: "smooth" });
  }

  showToast("AI Assessment completed! Personalized plan generated.");
}

// Proceed to Dashboard from Assessment Modal
function proceedToDashboard() {
  if (isLoggedIn()) {
    window.location.href = "dashboard.html";
  } else {
    // Set logged in and redirect
    setLoggedIn(true);
    window.location.href = "dashboard.html";
  }
}

// Handle Login Form Submit
function handleLoginSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById("login-email").value.trim();
  const passwordInput = document.getElementById("login-password").value.trim();

  if (!emailInput || !passwordInput) {
    alert("Please fill in both email and password.");
    return;
  }

  // Restore account profile or update user name from email
  let user;
  const cleanEmailKey = `metaai_user_${emailInput.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  const existingStored = localStorage.getItem(cleanEmailKey);
  if (existingStored) {
    try {
      user = JSON.parse(existingStored);
    } catch(err) {
      user = getUserData();
    }
  } else {
    user = getUserData();
  }

  user.email = emailInput;
  if (emailInput.includes("@")) {
    const extractedName = emailInput.split("@")[0];
    if (!user.name || user.name === "Bhavya" || user.name === "User") {
      user.name = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
    }
  }
  saveUserData(user);

  // Set auth state
  setLoggedIn(true);
  showToast("Login successful! Redirecting to dashboard...");
  
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 600);
}

// Handle Signup Form Submit
function handleSignupSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById("signup-name").value.trim();
  const emailInput = document.getElementById("signup-email").value.trim();
  const passwordInput = document.getElementById("signup-password").value;
  const confirmPasswordInput = document.getElementById("signup-confirm-password").value;

  if (!nameInput || !emailInput || !passwordInput) {
    alert("Please fill in all required fields.");
    return;
  }

  if (passwordInput !== confirmPasswordInput) {
    alert("Passwords do not match. Please re-enter.");
    return;
  }

  // Save new user profile
  const user = getUserData();
  user.name = nameInput;
  user.email = emailInput;
  saveUserData(user);
  setLoggedIn(true);

  showToast("Account created successfully! Redirecting...");
  
  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 600);
}

// --- 5. DASHBOARD PAGE INITIALIZATION ---
function initDashboardPage() {
  const user = getUserData();
  
  // Render user information
  renderDashboardHeader(user);
  renderOverviewMetrics(user);
  renderWorkoutsList(user);
  renderProfileForm(user);
  
  // Setup Sidebar Tab Navigation
  setupDashboardTabs();
  
  // Setup Mobile Sidebar Toggle
  const mobileToggle = document.getElementById("sidebar-toggle-btn");
  const sidebar = document.getElementById("dashboard-sidebar");
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
  }

  // Setup AI Coach Chat Engine
  setupAICoach(user);

  // Initialize Day-Based Schedule & Pacing Timer
  initDaySchedule();

  // Initialize Stress-Level Adaptive Workout Engine
  initStressPlanner();

  // Initialize Dynamic Nutrition Budget & Meal Tracker
  initNutritionModule(user);

  // Initialize Wellness (Sleep, Hydration, Mood-based Stress)
  initWellnessModule(user);

  // Initialize Customizable Inhale & Exhale Breathing Studio
  initBreathingStudio();

  // Initialize Customizable Steps Tracking Module
  initStepsModule(user);

  // Initialize 30-Day Daily Scenario Archive (Tied to Login)
  initScenarioArchiveModule(user);
}

// Render Topbar & Greetings
function renderDashboardHeader(user) {
  const greetingEl = document.getElementById("user-greeting-name");
  if (greetingEl) {
    greetingEl.textContent = user.name || "Bhavya";
  }

  const badgeNameEl = document.getElementById("user-badge-name");
  if (badgeNameEl) {
    badgeNameEl.textContent = user.name || "Bhavya";
  }

  const avatarCircle = document.getElementById("user-avatar-initial");
  if (avatarCircle) {
    avatarCircle.textContent = (user.name || "B").charAt(0).toUpperCase();
  }

  // Today's formatted date
  const dateEl = document.getElementById("dashboard-today-date");
  if (dateEl) {
    const now = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    dateEl.textContent = now.toLocaleDateString("en-US", options);
  }
}

// Render Overview Metric Cards (Calories burned & taken, time-based steps, wellness sleep duration)
function renderOverviewMetrics(user) {
  // 1. Calories: Workout Completed (Burned) vs Nutrition (Taken)
  const burnedKcal = user.burnedCalories || 420;
  const takenKcal = user.nutrition?.consumedKcal || 1640;
  const burnTarget = user.targetCalories || 600;

  const calBurnedEl = document.getElementById("metric-calories-burned");
  const calTakenEl = document.getElementById("metric-calories-taken");
  const calBar = document.getElementById("metric-calories-bar");
  const calStatus = document.getElementById("metric-calories-status");
  const netBalanceEl = document.getElementById("metric-net-balance");
  const legacyCalVal = document.getElementById("metric-calories");

  if (calBurnedEl) calBurnedEl.textContent = `${burnedKcal.toLocaleString()} kcal`;
  if (calTakenEl) calTakenEl.textContent = `${takenKcal.toLocaleString()} kcal`;
  if (legacyCalVal) legacyCalVal.textContent = `${burnedKcal} kcal`;

  const burnPct = Math.round((burnedKcal / burnTarget) * 100);
  if (calBar) calBar.style.width = `${Math.min(100, burnPct)}%`;
  if (calStatus) calStatus.textContent = `Burn Goal: ${burnPct}% (${burnedKcal}/${burnTarget} kcal)`;

  if (netBalanceEl) {
    const net = takenKcal - burnedKcal;
    const sign = net >= 0 ? "+" : "";
    netBalanceEl.textContent = `Net: ${sign}${net.toLocaleString()} kcal`;
    netBalanceEl.style.color = net >= 0 ? "var(--primary)" : "#2563EB";
  }

  // 2. Steps: Updated by user based on time and customized
  const steps = user.steps || 7842;
  const targetSteps = user.targetSteps || 10000;
  const stepsPct = Math.round((steps / targetSteps) * 100);

  const stepsVal = document.getElementById("metric-steps");
  const stepsTarget = document.getElementById("metric-steps-target");
  const stepsBar = document.getElementById("metric-steps-bar");
  const stepsPctEl = document.getElementById("metric-steps-pct");
  const stepsLeft = document.getElementById("metric-steps-left");

  if (stepsVal) stepsVal.textContent = steps.toLocaleString();
  if (stepsTarget) stepsTarget.textContent = targetSteps.toLocaleString();
  if (stepsBar) stepsBar.style.width = `${Math.min(100, stepsPct)}%`;
  if (stepsPctEl) stepsPctEl.textContent = `Daily Target: ${stepsPct}%`;
  if (stepsLeft) stepsLeft.textContent = `${Math.max(0, targetSteps - steps).toLocaleString()} steps left`;

  // 3. Water Intake
  const waterVal = document.getElementById("metric-water");
  if (waterVal) waterVal.textContent = `${(user.water || 1.8).toFixed(2)} L`;
  const waterPctSub = document.getElementById("metric-water-pct-sub");
  if (waterPctSub) waterPctSub.textContent = `Hydration: ${Math.round(((user.water || 1.8) / (user.targetWater || 3.0)) * 100)}%`;
  const waterBar = document.getElementById("metric-water-bar");
  if (waterBar) waterBar.style.width = `${Math.min(100, Math.round(((user.water || 1.8) / (user.targetWater || 3.0)) * 100))}%`;

  // 4. Sleep Duration: Maintained using Wellness category
  const sleepVal = document.getElementById("metric-sleep");
  const sleepBar = document.getElementById("metric-sleep-bar");
  const sleepPct = document.getElementById("metric-sleep-pct");
  const sleepNote = document.getElementById("metric-sleep-note");

  if (sleepVal) sleepVal.textContent = `${user.sleep || 7.5} hrs`;
  const sQuality = user.sleepQuality || 88;
  if (sleepBar) sleepBar.style.width = `${sQuality}%`;
  if (sleepPct) sleepPct.textContent = `Rest Quality: ${sQuality}%`;
  if (sleepNote) sleepNote.textContent = "Maintained via Wellness ✓";
}

// Quick Log Water Function (+250ml)
function logWaterQuick() {
  const user = getUserData();
  user.water = Math.min(5.0, (user.water || 1.8) + 0.25);
  saveUserData(user);
  renderOverviewMetrics(user);
  
  // Update hydration cups if currently in wellness view
  updateWellnessHydrationUI(user.water);
  showToast(`Logged 250ml water! Total: ${user.water.toFixed(2)} L 💧`);
}

// Setup Sidebar Tabs Navigation
function setupDashboardTabs() {
  const navButtons = document.querySelectorAll(".sidebar-nav .nav-item");
  const sections = document.querySelectorAll(".dashboard-section");

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      if (!targetId) return;

      // Update active nav button
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Show targeted section
      sections.forEach(sec => sec.classList.remove("active-section"));
      const targetSec = document.getElementById(targetId);
      if (targetSec) {
        targetSec.classList.add("active-section");
      }

      // If opening Progress section, re-sync live scenarios from user data
      if (targetId === "section-progress") {
        const currentUser = getUserData();
        if (typeof initScenarioArchiveModule === "function") {
          initScenarioArchiveModule(currentUser);
        }
      }

      // Close mobile drawer if opened
      const sidebar = document.getElementById("dashboard-sidebar");
      if (sidebar && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }

      // Scroll to top of content
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

// Render Workouts
function renderWorkoutsList(user) {
  const container = document.getElementById("workouts-container");
  if (!container) return;

  const workouts = user.workouts || DEFAULT_USER.workouts;
  container.innerHTML = "";

  workouts.forEach((w) => {
    const card = document.createElement("div");
    card.className = "workout-card";
    card.innerHTML = `
      <div class="workout-card-img-placeholder">
        <span>💪</span>
      </div>
      <div class="workout-card-body">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h4 class="workout-title">${w.name}</h4>
            <span class="badge badge-green">${w.difficulty}</span>
          </div>
          <div class="workout-stats-chips">
            <span class="workout-stat-chip">⏱ ${w.duration}</span>
            <span class="workout-stat-chip">🔥 ${w.calories}</span>
          </div>
          <div style="margin-bottom:1.2rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.3rem;">
              <span>Completion</span>
              <strong id="w-prog-txt-${w.id}">${w.progress}%</strong>
            </div>
            <div class="progress-bar-bg">
              <div id="w-prog-bar-${w.id}" class="progress-bar-fill" style="width: ${w.progress}%;"></div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-block" onclick="startWorkoutSession(${w.id}, '${w.name}')">
          Start Workout ▶
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- DAY-OF-THE-WEEK WORKOUT SCHEDULE & TIMER PACING PROTOCOLS ---
const DAY_PROTOCOLS = {
  Monday: {
    day: "Monday",
    title: "Monday – Power Strength Day",
    desc: "Heavy compound resistance training to kick off the week with peak metabolic power.",
    timerSeconds: 45,
    workoutId: 1,
    workoutName: "Full Body Strength",
    badge: "45s Work Interval",
    icon: "🏋️"
  },
  Tuesday: {
    day: "Tuesday",
    title: "Tuesday – Cardio Velocity Day",
    desc: "High-cadence aerobic conditioning to elevate cardiovascular endurance and VO2 max.",
    timerSeconds: 35,
    workoutId: 2,
    workoutName: "Cardio Training",
    badge: "35s Work Interval",
    icon: "🏃"
  },
  Wednesday: {
    day: "Wednesday",
    title: "Wednesday – Core & Stability Day",
    desc: "Targeted abdominal, oblique, and spinal stabilization to reinforce core power.",
    timerSeconds: 40,
    workoutId: 3,
    workoutName: "Core Workout",
    badge: "40s Work Interval",
    icon: "🧘"
  },
  Thursday: {
    day: "Thursday",
    title: "Thursday – Active Mobility & Recovery",
    desc: "Joint decompression, hip mobility, and myofascial posture resetting to lower cortisol.",
    timerSeconds: 50,
    workoutId: 4,
    workoutName: "Stretching & Mobility",
    badge: "50s Flow Interval",
    icon: "🌊"
  },
  Friday: {
    day: "Friday",
    title: "Friday – Full-Body Strength Hypertrophy",
    desc: "End-of-week full-body resistance circuit pushing muscles to peak volume.",
    timerSeconds: 45,
    workoutId: 1,
    workoutName: "Full Body Strength",
    badge: "45s Work Interval",
    icon: "⚡"
  },
  Saturday: {
    day: "Saturday",
    title: "Saturday – Athletic Performance & Conditioning",
    desc: "Power endurance intervals designed for athletic stamina, core agility, and overall conditioning.",
    timerSeconds: 30,
    workoutId: 5,
    workoutName: "Athletic Conditioning",
    badge: "30s Max Effort",
    icon: "⚡"
  },
  Sunday: {
    day: "Sunday",
    title: "Sunday – Restorative Mindful Flow",
    desc: "Low-intensity mobility stretches, parasympathetic breathing, and total body recovery.",
    timerSeconds: 60,
    workoutId: 4,
    workoutName: "Stretching & Mobility",
    badge: "60s Sustained Hold",
    icon: "🌿"
  }
};

let currentActiveDay = "Thursday";

// --- DISTINCT WORKOUT POSTURES FOR EVERY WORKOUT (USING MEN AI IMAGES) ---
const WORKOUT_POSTURES_BY_ROUTINE = {
  // 1: Full Body Strength
  1: {
    workoutName: "Full Body Strength",
    postures: [
      {
        name: "Deep Barbell Back Squat",
        muscles: "Target: Quadriceps, Gluteus Maximus, Hamstrings & Core",
        image: "assets/images/men_strength.jpg",
        alignment: "AI Posture Check: Spine Neutral • Knees Tracking Over Toes • Thighs Parallel",
        cues: [
          "Keep your chest upright, shoulder blades retracted, and core braced tight.",
          "Break at the hips and knees simultaneously, lowering until thighs are parallel.",
          "Drive forcefully through your heels to return upright, exhaling at the top."
        ]
      },
      {
        name: "Dumbbell Chest Press & Push-up Form",
        muscles: "Target: Pectoralis Major, Anterior Deltoids & Triceps",
        image: "assets/images/men_strength.jpg",
        alignment: "AI Posture Check: 45° Elbow Angle • Straight Planks Line Head-to-Heels",
        cues: [
          "Maintain a rigid neutral spine without letting your hips sag downward.",
          "Keep elbows tucked at roughly 45 degrees relative to your torso.",
          "Press the floor away or drive dumbbells upward in a smooth arc."
        ]
      },
      {
        name: "Bent-Over Dumbbell Resistance Row",
        muscles: "Target: Latissimus Dorsi, Rhomboids, Rear Delts & Biceps",
        image: "assets/images/men_strength.jpg",
        alignment: "AI Posture Check: 45° Hip Hinge • Flat Lumbar Spine • Neck Relaxed",
        cues: [
          "Hinge forward at the hips with soft knees and a straight spine.",
          "Pull the weight toward your ribcage by driving your elbows backward.",
          "Squeeze your shoulder blades together firmly at the peak contraction."
        ]
      }
    ]
  },

  // 2: Cardio Training
  2: {
    workoutName: "Cardio Training",
    postures: [
      {
        name: "High-Intensity Knees Sprint Cadence",
        muscles: "Target: Hip Flexors, Quadriceps, Calves & Cardiovascular Engine",
        image: "assets/images/men_cardio.jpg",
        alignment: "AI Posture Check: Upright Torso • Knee Lift to 90° • Soft Forefoot Landing",
        cues: [
          "Drive knees upward rapidly toward chest height while maintaining tall posture.",
          "Stay light on the balls of your feet to minimize impact stress on joints.",
          "Pump your arms in synchronization with opposite leg drives for momentum."
        ]
      },
      {
        name: "Rapid Mountain Climbers Drive",
        muscles: "Target: Rectus Abdominis, Shoulders, Hip Flexors & Heart Rate",
        image: "assets/images/men_cardio.jpg",
        alignment: "AI Posture Check: Hands Directly Under Shoulders • Hips Level with Spine",
        cues: [
          "Lock into a strong push-up plank with hands firmly planted under shoulders.",
          "Drive alternate knees toward your elbows with rapid, controlled rhythm.",
          "Keep hips down in line with shoulders; avoid bouncing your pelvis."
        ]
      },
      {
        name: "Lateral Speed Skater Plyometrics",
        muscles: "Target: Glute Medius, Adductors, Hamstrings & Dynamic Balance",
        image: "assets/images/men_cardio.jpg",
        alignment: "AI Posture Check: Soft Knee Cushioning • Torso Hinged • Controlled Balance",
        cues: [
          "Bound laterally off your outside leg, landing softly on the opposite foot.",
          "Sweep your trailing leg behind in a balanced skater position.",
          "Absorb shock through the hips and immediately explode in the other direction."
        ]
      }
    ]
  },

  // 3: Core Workout
  3: {
    workoutName: "Core Workout",
    postures: [
      {
        name: "Forearm Neutral Isometric Plank",
        muscles: "Target: Transverse Abdominis, Internal Obliques & Spinal Erectors",
        image: "assets/images/men_core.jpg",
        alignment: "AI Posture Check: Forearms Parallel • Neutral Pelvic Tilt • Head in Line",
        cues: [
          "Position forearms flat on the ground with elbows aligned under shoulders.",
          "Engage your glutes and draw your belly button inward toward your spine.",
          "Breathe steadily while holding a rock-solid, unwavering bridge."
        ]
      },
      {
        name: "Seated Russian Rotational Twists",
        muscles: "Target: External Obliques, Transverse Core & Hip Stabilizers",
        image: "assets/images/men_core.jpg",
        alignment: "AI Posture Check: 45° Torso Incline • Chest Proud • Controlled Rotation",
        cues: [
          "Sit with knees bent, lean torso backward to 45 degrees with chest high.",
          "Rotate your ribcage from side to side, bringing hands past your hips.",
          "Keep core braced and prevent rounding your lower back during rotation."
        ]
      },
      {
        name: "Dead Bug Deep Abdominal Stabilization",
        muscles: "Target: Deep Core, Pelvic Floor & Lower Lumbar Support",
        image: "assets/images/men_core.jpg",
        alignment: "AI Posture Check: Lumbar Pressed Flat • Opposite Arm/Leg Synchrony",
        cues: [
          "Lie on your back with knees at 90 degrees and arms pointing to ceiling.",
          "Slowly extend opposite arm and opposite leg toward the floor.",
          "Keep lower back completely pressed into the floor throughout the movement."
        ]
      }
    ]
  },

  // 4: Stretching & Mobility
  4: {
    workoutName: "Stretching & Mobility",
    postures: [
      {
        name: "Prone Cobra & Thoracic Spine Extension",
        muscles: "Target: Thoracic Spine, Pectorals, Neck Flexors & Lumbar Relief",
        image: "assets/images/men_stretch.jpg",
        alignment: "AI Posture Check: Pelvis Grounded • Shoulders Down • Gentle Curve",
        cues: [
          "Lie prone on your mat with hands under shoulders, palms flat.",
          "Inhale as you gently press through your hands to lift your chest upward.",
          "Keep shoulders rolled back and down away from ears; breathe into your abdomen."
        ]
      },
      {
        name: "Deep Runner's Lunge & Psoas Hip Opener",
        muscles: "Target: Iliopsoas (Hip Flexor), Groin, Gluteus & Quads",
        image: "assets/images/men_stretch.jpg",
        alignment: "AI Posture Check: Front Knee Directly Above Ankle • Hips Square",
        cues: [
          "Step right foot forward into a deep lunge, dropping back knee gently.",
          "Rest hands on the ground or front thigh, pressing hips gently forward.",
          "Hold the stretch while breathing deeply into tight hip capsules."
        ]
      },
      {
        name: "Downward Dog & Posterior Chain Lengthener",
        muscles: "Target: Hamstrings, Calves, Latissimus Dorsi & Achilles Tendon",
        image: "assets/images/men_stretch.jpg",
        alignment: "AI Posture Check: Inverted 'V' • Sit Bones Lifted High • Spine Elongated",
        cues: [
          "Form an inverted V shape by pushing sit bones high toward ceiling.",
          "Press palms firmly into floor, distributing weight evenly across fingers.",
          "Sink your heels gently downward to release tension along calves and hamstrings."
        ]
      }
    ]
  },

  // 5: Athletic Conditioning
  5: {
    workoutName: "Athletic Conditioning",
    postures: [
      {
        name: "Explosive Kettlebell Hip Hinge Swings",
        muscles: "Target: Posterior Chain, Gluteus Maximus, Hamstrings & Core",
        image: "assets/images/men_hiit.jpg",
        alignment: "AI Posture Check: Powerful Hip Hinge • Flat Spine • Weight Floats to Chest",
        cues: [
          "Hinge at the hips with soft knees, sending hips back without squatting.",
          "Snap hips forward forcefully and squeeze glutes to propel weight upward.",
          "Let arms stay relaxed as the weight floats to chest height; do not pull with arms."
        ]
      },
      {
        name: "Dynamic Tuck Jumps & Burpee Stance",
        muscles: "Target: Full Body Power, Calves, Quads, Core & Anaerobic Capacity",
        image: "assets/images/men_hiit.jpg",
        alignment: "AI Posture Check: Soft Toe-to-Heel Landing • Explosive Upward Drive",
        cues: [
          "Drop quickly into a squat thrust, kick feet back to a plank position.",
          "Jump feet back forward and explode upward into a powerful vertical leap.",
          "Land softly with bent knees to immediately transition into next repetition."
        ]
      },
      {
        name: "Squat Thrust to High Overhead Reach",
        muscles: "Target: Shoulders, Core, Quadriceps & Aerobic Stamina",
        image: "assets/images/men_hiit.jpg",
        alignment: "AI Posture Check: Solid Core Plank • Deep Squat Transition • Tall Reach",
        cues: [
          "Plant hands firmly, jump feet back into a braced straight plank.",
          "Jump feet back toward hands, landing in a wide squat base.",
          "Drive to standing and extend arms high overhead with full body extension."
        ]
      }
    ]
  }
};

// --- WEB AUDIO API SYNTHESIZER (TIMER AUDIO) ---
let audioCtx = null;
let isAudioMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTimerBeep(freq = 520, duration = 0.12, type = 'sine') {
  if (isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio context may require gesture, handled gracefully
  }
}

function playWorkoutFanfare() {
  if (isAudioMuted) return;
  [523, 659, 784, 1046].forEach((f, i) => {
    setTimeout(() => playTimerBeep(f, 0.22, 'triangle'), i * 130);
  });
}

function toggleTimerSound() {
  isAudioMuted = !isAudioMuted;
  const iconEl = document.getElementById("timer-sound-icon");
  const lblEl = document.getElementById("timer-sound-label");
  if (iconEl && lblEl) {
    iconEl.textContent = isAudioMuted ? "🔇" : "🔊";
    lblEl.textContent = isAudioMuted ? "Timer Audio: OFF" : "Timer Audio: ON";
  }
  if (!isAudioMuted) {
    playTimerBeep(660, 0.1, 'sine');
  }
}

// --- DAY-BASED PROTOCOL CONTROLLER ---
function initDaySchedule() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = days[new Date().getDay()];
  setDayProtocol(todayName);
}

function setDayProtocol(dayName) {
  const proto = DAY_PROTOCOLS[dayName] || DAY_PROTOCOLS["Thursday"];
  currentActiveDay = dayName;

  const activeBadge = document.getElementById("active-day-badge");
  const dayIcon = document.getElementById("day-icon");
  const dayTitle = document.getElementById("day-title-text");
  const timerBadge = document.getElementById("day-timer-badge");
  const dayDesc = document.getElementById("day-desc-text");

  if (activeBadge) activeBadge.textContent = `Today: ${dayName} Schedule`;
  if (dayIcon) dayIcon.textContent = proto.icon || "📅";
  if (dayTitle) dayTitle.textContent = proto.title;
  if (timerBadge) timerBadge.textContent = proto.badge;
  if (dayDesc) dayDesc.textContent = proto.desc;
}

// --- STRESS-LEVEL ADAPTIVE WORKOUT PLANNER ---
let currentStressLevel = "low";

function initStressPlanner() {
  applyStressAdaptation("low");
}

function applyStressAdaptation(level) {
  currentStressLevel = level;

  // Update pills active state
  ["low", "moderate", "high"].forEach(l => {
    const pill = document.getElementById(`stress-pill-${l}`);
    if (pill) {
      if (l === level) pill.classList.add("active");
      else pill.classList.remove("active");
    }
  });

  const indexDisplay = document.getElementById("stress-index-display");
  const titleEl = document.getElementById("stress-rec-title");
  const descEl = document.getElementById("stress-rec-desc");
  const adviceBanner = document.getElementById("stress-advice-banner");

  if (level === "low") {
    if (indexDisplay) indexDisplay.textContent = "24 / 100 (Optimal Recovery)";
    if (titleEl) titleEl.textContent = "Maximum Readiness Zone – Heavy Resistance & Strength Training";
    if (descEl) descEl.textContent = "Your nervous system is primed with high Heart Rate Variability. Great day for Full Body Strength or Athletic Conditioning.";
    if (adviceBanner) adviceBanner.style.borderColor = "rgba(34, 160, 107, 0.4)";
  } else if (level === "moderate") {
    if (indexDisplay) indexDisplay.textContent = "52 / 100 (Balanced Load)";
    if (titleEl) titleEl.textContent = "Moderate Readiness – Steady-State Cardio & Core Control";
    if (descEl) descEl.textContent = "Balanced fatigue detected. Maintain athletic momentum with steady-state cardio or core stabilization without overtaxing joints.";
    if (adviceBanner) adviceBanner.style.borderColor = "rgba(59, 130, 246, 0.4)";
  } else if (level === "high") {
    if (indexDisplay) indexDisplay.textContent = "84 / 100 (High Fatigue Alert)";
    if (titleEl) titleEl.textContent = "Active Recovery & Mobility – Gentle Spine & Joint Decompression";
    if (descEl) descEl.textContent = "Elevated cortisol and fatigue detected. High intensity resistance is contraindicated today. Prioritize Stretching & Mobility to reset your nervous system.";
    if (adviceBanner) adviceBanner.style.borderColor = "rgba(239, 68, 68, 0.4)";
  }

  showToast(`Adapted workout plan for ${level.toUpperCase()} stress! 🎯`);
}

function startRecommendedStressWorkout() {
  if (currentStressLevel === "low") {
    startWorkoutSession(1, "Full Body Strength");
  } else if (currentStressLevel === "moderate") {
    startWorkoutSession(2, "Cardio Training");
  } else {
    startWorkoutSession(4, "Stretching & Mobility");
  }
}

// --- WORKOUT TIMER STATE MACHINE ---
let currentSessionWorkout = null;
let sessionExerciseIndex = 0;
let sessionSecondsRemaining = 45;
let sessionStepDuration = 45;
let sessionTimerInterval = null;
let isSessionPaused = false;

// Interactive Start Workout Session (Launches Live Timer Modal)
function startWorkoutSession(workoutId, workoutName) {
  currentSessionWorkout = { id: workoutId, name: workoutName };
  sessionExerciseIndex = 0;
  isSessionPaused = false;

  // Determine timer interval based on active day protocol
  const dayProto = DAY_PROTOCOLS[currentActiveDay] || DAY_PROTOCOLS["Thursday"];
  sessionStepDuration = dayProto.timerSeconds || 45;
  sessionSecondsRemaining = sessionStepDuration;

  // Set modal header text
  const routineBadge = document.getElementById("session-routine-badge");
  const titleEl = document.getElementById("session-workout-name");
  const dayNote = document.getElementById("session-day-pacing-note");

  if (routineBadge) routineBadge.textContent = `WORKOUT ROUTINE: ${workoutName.toUpperCase()}`;
  if (titleEl) titleEl.textContent = workoutName;
  if (dayNote) dayNote.textContent = `${currentActiveDay}: ${sessionStepDuration}s Timer Pacing`;

  // Open the workout session modal
  openModal("workout-timer-modal");

  // Load first exercise & start timer
  loadSessionExercise(sessionExerciseIndex);
  startSessionInterval();

  // Play initial chime
  playTimerBeep(523, 0.15, 'sine');
}

function loadSessionExercise(index) {
  // Retrieve the specific postures for this workout routine
  const routineData = WORKOUT_POSTURES_BY_ROUTINE[currentSessionWorkout.id] || WORKOUT_POSTURES_BY_ROUTINE[1];
  const postures = routineData.postures;
  const current = postures[index % postures.length];

  // Update step tag
  const stepTag = document.getElementById("session-step-tag");
  if (stepTag) stepTag.textContent = `EXERCISE ${index + 1} OF ${postures.length}`;

  // Update exercise name
  const nameEl = document.getElementById("session-exercise-name");
  if (nameEl) nameEl.textContent = current.name;

  // Update target muscles
  const muscleEl = document.getElementById("session-target-muscles");
  if (muscleEl) muscleEl.textContent = current.muscles;

  // Update Men AI Image
  const imgEl = document.getElementById("session-posture-img");
  if (imgEl) {
    imgEl.src = current.image;
    imgEl.alt = current.name;
  }

  // Update Alignment Tag
  const alignText = document.getElementById("session-alignment-text");
  if (alignText) alignText.textContent = current.alignment;

  // Update posture cues
  const cuesEl = document.getElementById("session-posture-cues");
  if (cuesEl) {
    cuesEl.innerHTML = current.cues.map(c => `<li>${c}</li>`).join("");
  }

  // Reset timer countdown to day's pacing interval
  sessionSecondsRemaining = sessionStepDuration;
  updateTimerUI();
}

function startSessionInterval() {
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);

  sessionTimerInterval = setInterval(() => {
    if (isSessionPaused) return;

    sessionSecondsRemaining--;
    updateTimerUI();

    // Audible countdown ticks on last 3, 2, 1 seconds
    if (sessionSecondsRemaining === 3) {
      playTimerBeep(587, 0.14, 'triangle');
    } else if (sessionSecondsRemaining === 2) {
      playTimerBeep(659, 0.14, 'triangle');
    } else if (sessionSecondsRemaining === 1) {
      playTimerBeep(880, 0.18, 'triangle');
    } else if (sessionSecondsRemaining <= 0) {
      // Exercise step finished!
      playWorkoutFanfare();
      const routineData = WORKOUT_POSTURES_BY_ROUTINE[currentSessionWorkout.id] || WORKOUT_POSTURES_BY_ROUTINE[1];
      const postures = routineData.postures;

      if (sessionExerciseIndex < postures.length - 1) {
        sessionExerciseIndex++;
        loadSessionExercise(sessionExerciseIndex);
      } else {
        // Complete full workout
        finishWorkoutSession();
      }
    }
  }, 1000);
}

function updateTimerUI() {
  const textEl = document.getElementById("timer-seconds-text");
  const ringEl = document.getElementById("timer-progress-ring");

  if (textEl) textEl.textContent = sessionSecondsRemaining;

  if (ringEl) {
    const totalCircumference = 565; // 2 * PI * 90
    const progressFraction = Math.max(0, sessionSecondsRemaining / sessionStepDuration);
    const offset = totalCircumference - (totalCircumference * progressFraction);
    ringEl.style.strokeDashoffset = offset;

    // Color feedback as timer winds down
    if (sessionSecondsRemaining <= 3) {
      ringEl.className = "timer-circle-progress danger";
    } else if (sessionSecondsRemaining <= 10) {
      ringEl.className = "timer-circle-progress warning";
    } else {
      ringEl.className = "timer-circle-progress";
    }
  }
}

function toggleWorkoutPause() {
  isSessionPaused = !isSessionPaused;
  const pauseBtn = document.getElementById("timer-pause-btn");
  const statusEl = document.getElementById("timer-status-text");

  if (pauseBtn) {
    pauseBtn.textContent = isSessionPaused ? "▶ Resume" : "⏸ Pause";
  }
  if (statusEl) {
    statusEl.textContent = isSessionPaused ? "SESSION PAUSED" : "SECONDS LEFT";
  }
  if (!isSessionPaused) {
    playTimerBeep(520, 0.08, 'sine');
  }
}

function skipToNextExercise() {
  const routineData = WORKOUT_POSTURES_BY_ROUTINE[currentSessionWorkout.id] || WORKOUT_POSTURES_BY_ROUTINE[1];
  const postures = routineData.postures;
  playTimerBeep(784, 0.12, 'triangle');

  if (sessionExerciseIndex < postures.length - 1) {
    sessionExerciseIndex++;
    loadSessionExercise(sessionExerciseIndex);
  } else {
    finishWorkoutSession();
  }
}

function finishWorkoutSession() {
  clearInterval(sessionTimerInterval);
  sessionTimerInterval = null;

  const user = getUserData();
  let burnKcal = 85;
  if (currentSessionWorkout) {
    const workout = (user.workouts || DEFAULT_USER.workouts).find(w => w.id === currentSessionWorkout.id);
    if (workout) {
      workout.progress = Math.min(100, workout.progress + 25);
      const parsed = parseInt(workout.calories);
      if (!isNaN(parsed) && parsed > 0) burnKcal = parsed;
    }
  }

  user.burnedCalories = (user.burnedCalories || 420) + burnKcal;
  user.workoutsCompleted = (user.workoutsCompleted || 12) + 1;
  saveUserData(user);

  renderOverviewMetrics(user);
  renderWorkoutsList(user);

  closeModal("workout-timer-modal");
  playWorkoutFanfare();
  showToast(`🎉 ${currentSessionWorkout?.name || 'Workout'} complete! Burned ${burnKcal} kcal with perfect form!`);
}

function exitWorkoutSession() {
  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
  closeModal("workout-timer-modal");
}

// --- DYNAMIC NUTRITION BUDGET & MEAL TRACKING MODULE ---
function initNutritionModule(user) {
  if (!user.nutrition) {
    user.nutrition = JSON.parse(JSON.stringify(DEFAULT_USER.nutrition));
    saveUserData(user);
  }
  renderNutritionBudgetUI(user);
}

function renderNutritionBudgetUI(user) {
  const n = user.nutrition || DEFAULT_USER.nutrition;

  // Calorie Numbers
  const consumedEl = document.getElementById("nutrition-consumed-kcal");
  const targetEl = document.getElementById("nutrition-target-kcal");
  const remainingEl = document.getElementById("nutrition-remaining-kcal");

  if (consumedEl) consumedEl.textContent = n.consumedKcal.toLocaleString();
  if (targetEl) targetEl.textContent = n.targetKcal.toLocaleString();
  
  const remainingKcal = Math.max(0, n.targetKcal - n.consumedKcal);
  if (remainingEl) {
    remainingEl.textContent = remainingKcal.toLocaleString();
    if (n.consumedKcal > n.targetKcal) {
      remainingEl.innerHTML = `<span style="color:#DC2626;">+${(n.consumedKcal - n.targetKcal).toLocaleString()} kcal over budget</span>`;
    }
  }

  // Protein Bar & Numbers
  const proteinVal = document.getElementById("macro-protein-val");
  const proteinTarget = document.getElementById("macro-protein-target");
  const proteinPct = document.getElementById("macro-protein-pct");
  const proteinBar = document.getElementById("macro-protein-bar");

  const pPct = Math.round((n.protein / (n.proteinTarget || 150)) * 100);
  if (proteinVal) proteinVal.textContent = n.protein;
  if (proteinTarget) proteinTarget.textContent = n.proteinTarget || 150;
  if (proteinPct) proteinPct.textContent = `${pPct}%`;
  if (proteinBar) proteinBar.style.width = `${Math.min(100, pPct)}%`;

  // Carbs Bar & Numbers
  const carbsVal = document.getElementById("macro-carbs-val");
  const carbsPct = document.getElementById("macro-carbs-pct");
  const carbsBar = document.getElementById("macro-carbs-bar");

  const cPct = Math.round((n.carbs / (n.carbsTarget || 230)) * 100);
  if (carbsVal) carbsVal.textContent = n.carbs;
  if (carbsPct) carbsPct.textContent = `${cPct}%`;
  if (carbsBar) carbsBar.style.width = `${Math.min(100, cPct)}%`;

  // Fats Bar & Numbers
  const fatsVal = document.getElementById("macro-fats-val");
  const fatsPct = document.getElementById("macro-fats-pct");
  const fatsBar = document.getElementById("macro-fats-bar");

  const fPct = Math.round((n.fats / (n.fatsTarget || 65)) * 100);
  if (fatsVal) fatsVal.textContent = n.fats;
  if (fatsPct) fatsPct.textContent = `${fPct}%`;
  if (fatsBar) fatsBar.style.width = `${Math.min(100, fPct)}%`;

  // SVG Rings Chart
  const calRing = document.getElementById("calorie-budget-ring");
  const proRing = document.getElementById("protein-budget-ring");
  const chartPctEl = document.getElementById("budget-chart-pct");

  if (calRing) {
    const calCircumference = 327; // 2 * PI * 52
    const calFraction = Math.min(1, n.consumedKcal / n.targetKcal);
    calRing.style.strokeDashoffset = calCircumference - (calCircumference * calFraction);
  }

  if (proRing) {
    const proCircumference = 251; // 2 * PI * 40
    const proFraction = Math.min(1, n.protein / (n.proteinTarget || 150));
    proRing.style.strokeDashoffset = proCircumference - (proCircumference * proFraction);
  }

  if (chartPctEl) {
    const overallPct = Math.round((n.consumedKcal / n.targetKcal) * 100);
    chartPctEl.textContent = `${overallPct}%`;
  }

  // Render Logged Meals History List with clear Delete Buttons
  const listEl = document.getElementById("logged-meals-history");
  if (listEl) {
    const meals = n.loggedMeals || [];
    if (meals.length === 0) {
      listEl.innerHTML = `<div style="font-size:0.8rem;color:var(--text-muted);font-style:italic;padding:0.4rem 0;">No meals logged yet today. Click + on any meal to add calories & protein!</div>`;
    } else {
      listEl.innerHTML = meals.map((m, idx) => `
        <div class="logged-meal-item">
          <div>
            <div class="item-title">${m.name} <span style="font-size:0.75rem;font-weight:normal;color:var(--text-muted);">(${m.type || 'Meal'} • ${m.time || 'Today'})</span></div>
            <div class="item-macros">+${m.kcal} kcal • <strong style="color:var(--primary);">+${m.protein}g Protein</strong></div>
          </div>
          <button class="item-remove-btn" onclick="removeLoggedMeal(${idx})" title="Delete this meal from budget" style="display:flex;align-items:center;gap:0.2rem;font-size:0.78rem;font-weight:700;">
            <span>🗑️</span> <span>Delete</span>
          </button>
        </div>
      `).join("");
    }
  }

  // Also update Overview Calories Card
  renderOverviewMetrics(user);
}

// Log Food / Nutrition Item (adds calories and protein to budget chart!)
function logMealItem(mealType, dishName, calories, protein, carbs, fats, btnElement) {
  const user = getUserData();
  if (!user.nutrition) {
    user.nutrition = JSON.parse(JSON.stringify(DEFAULT_USER.nutrition));
  }

  user.nutrition.consumedKcal += calories;
  user.nutrition.protein += protein;
  user.nutrition.carbs += (carbs || 0);
  user.nutrition.fats += (fats || 0);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!user.nutrition.loggedMeals) user.nutrition.loggedMeals = [];
  user.nutrition.loggedMeals.push({
    id: Date.now(),
    type: mealType,
    name: dishName,
    kcal: calories,
    protein: protein,
    carbs: carbs || 0,
    fats: fats || 0,
    time: timeStr
  });

  saveUserData(user);
  renderNutritionBudgetUI(user);

  // Play pleasant meal logged audio cue
  playTimerBeep(587, 0.15, 'triangle');
  setTimeout(() => playTimerBeep(880, 0.2, 'sine'), 120);

  // Button feedback animation
  if (btnElement) {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = `✓ Added (+${protein}g Pro)`;
    btnElement.style.background = "#10B981";
    setTimeout(() => {
      btnElement.innerHTML = originalText;
      btnElement.style.background = "";
    }, 1800);
  }

  showToast(`Added ${dishName}: +${calories} kcal & +${protein}g protein added to your budget chart! 🥣`);
}

// Delete Meal by Name directly from Meal Cards (- Delete button)
function deleteMealByName(dishName) {
  const user = getUserData();
  if (!user.nutrition || !user.nutrition.loggedMeals || user.nutrition.loggedMeals.length === 0) {
    showToast(`No logged servings of ${dishName} found in today's log to delete.`);
    return;
  }

  // Find the last logged entry matching this dish name
  let foundIndex = -1;
  for (let i = user.nutrition.loggedMeals.length - 1; i >= 0; i--) {
    if (user.nutrition.loggedMeals[i].name === dishName) {
      foundIndex = i;
      break;
    }
  }

  if (foundIndex === -1) {
    showToast(`No logged servings of ${dishName} currently in today's budget.`);
    return;
  }

  const removed = user.nutrition.loggedMeals.splice(foundIndex, 1)[0];
  user.nutrition.consumedKcal = Math.max(0, user.nutrition.consumedKcal - removed.kcal);
  user.nutrition.protein = Math.max(0, user.nutrition.protein - removed.protein);
  user.nutrition.carbs = Math.max(0, user.nutrition.carbs - (removed.carbs || 0));
  user.nutrition.fats = Math.max(0, user.nutrition.fats - (removed.fats || 0));

  saveUserData(user);
  renderNutritionBudgetUI(user);

  playTimerBeep(392, 0.12, 'sine');
  showToast(`Deleted ${dishName}: -${removed.kcal} kcal & -${removed.protein}g protein subtracted from budget! 🗑️`);
}

// Delete specific logged meal item from list
function removeLoggedMeal(mealIndex) {
  const user = getUserData();
  if (!user.nutrition || !user.nutrition.loggedMeals) return;

  const removed = user.nutrition.loggedMeals.splice(mealIndex, 1)[0];
  if (removed) {
    user.nutrition.consumedKcal = Math.max(0, user.nutrition.consumedKcal - removed.kcal);
    user.nutrition.protein = Math.max(0, user.nutrition.protein - removed.protein);
    user.nutrition.carbs = Math.max(0, user.nutrition.carbs - (removed.carbs || 0));
    user.nutrition.fats = Math.max(0, user.nutrition.fats - (removed.fats || 0));

    saveUserData(user);
    renderNutritionBudgetUI(user);
    playTimerBeep(440, 0.1, 'sine');
    showToast(`Deleted ${removed.name}: -${removed.kcal} kcal & -${removed.protein}g protein subtracted! 🗑️`);
  }
}

// Reset Option for Daily Calorie & Protein Budget (User explicitly requested!)
function resetTodayNutritionLog() {
  if (confirm("Reset today's daily calorie and protein budget? This will clear all logged meals and return consumed totals to 0.")) {
    const user = getUserData();
    user.nutrition = {
      consumedKcal: 0,
      targetKcal: user.nutrition?.targetKcal || 2100,
      protein: 0,
      proteinTarget: user.nutrition?.proteinTarget || 150,
      carbs: 0,
      carbsTarget: 230,
      fats: 0,
      fatsTarget: 65,
      loggedMeals: []
    };
    saveUserData(user);
    renderNutritionBudgetUI(user);
    playTimerBeep(520, 0.15, 'sine');
    showToast("Daily calorie & protein budget reset to zero! ↺");
  }
}

function addCustomMealItem() {
  const nameInp = document.getElementById("custom-meal-name");
  const kcalInp = document.getElementById("custom-meal-kcal");
  const proInp = document.getElementById("custom-meal-protein");
  const carbsInp = document.getElementById("custom-meal-carbs");

  const name = nameInp?.value.trim() || "Custom Meal";
  const kcal = parseInt(kcalInp?.value) || 250;
  const protein = parseInt(proInp?.value) || 20;
  const carbs = parseInt(carbsInp?.value) || 25;

  logMealItem("Custom", name, kcal, protein, carbs, 6, null);

  if (nameInp) nameInp.value = "";
  if (kcalInp) kcalInp.value = "";
  if (proInp) proInp.value = "";
  if (carbsInp) carbsInp.value = "";
}

// --- STEPS TRACKING MODULE (CUSTOMIZED BY TIME) ---
function initStepsModule(user) {
  if (!user.stepLogs) {
    user.stepLogs = [
      { id: 1, time: "07:45 AM", label: "Morning Walk 🌅", count: 3200 },
      { id: 2, time: "01:20 PM", label: "Lunch Break Stroll ☀️", count: 2450 },
      { id: 3, time: "05:15 PM", label: "Evening Walk / Run 🌙", count: 2192 }
    ];
    saveUserData(user);
  }
  renderStepsUI(user);
}

function renderStepsUI(user) {
  const steps = user.steps || 7842;
  const target = user.targetSteps || 10000;
  const pct = Math.round((steps / target) * 100);

  const stepsVal = document.getElementById("metric-steps");
  const stepsTarget = document.getElementById("metric-steps-target");
  const stepsBar = document.getElementById("metric-steps-bar");
  const stepsPct = document.getElementById("metric-steps-pct");
  const stepsLeft = document.getElementById("metric-steps-left");

  if (stepsVal) stepsVal.textContent = steps.toLocaleString();
  if (stepsTarget) stepsTarget.textContent = target.toLocaleString();
  if (stepsBar) stepsBar.style.width = `${Math.min(100, pct)}%`;
  if (stepsPct) stepsPct.textContent = `Daily Target: ${pct}%`;
  if (stepsLeft) stepsLeft.textContent = `${Math.max(0, target - steps).toLocaleString()} steps left`;

  // Modal elements
  const modalDisp = document.getElementById("modal-current-steps-display");
  const modalPct = document.getElementById("modal-steps-pct-badge");
  if (modalDisp) modalDisp.textContent = `${steps.toLocaleString()} / ${target.toLocaleString()}`;
  if (modalPct) modalPct.textContent = `${pct}% Goal`;

  renderStepsLogList(user);
}

function renderStepsLogList(user) {
  const listEl = document.getElementById("modal-steps-log-list");
  if (!listEl) return;
  const logs = user.stepLogs || [];
  if (logs.length === 0) {
    listEl.innerHTML = `<div style="font-size:0.8rem;color:var(--text-muted);font-style:italic;padding:0.5rem 0;">No step logs recorded yet today. Add steps above!</div>`;
    return;
  }

  listEl.innerHTML = logs.map((log, idx) => `
    <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg);padding:0.5rem 0.8rem;border-radius:var(--radius-sm);border:1px solid var(--border);font-size:0.85rem;">
      <div>
        <div style="font-weight:700;color:var(--dark);">${log.label || 'Walk'} <span style="font-size:0.75rem;font-weight:normal;color:var(--text-muted);">(${log.time || 'Today'})</span></div>
        <div style="font-size:0.78rem;color:#2563EB;font-weight:700;">+${(log.count || 0).toLocaleString()} steps</div>
      </div>
      <button class="item-remove-btn" onclick="removeStepLog(${idx})" title="Remove step entry" style="border:none;background:none;color:#DC2626;cursor:pointer;font-size:1.1rem;padding:0.2rem 0.4rem;">&times;</button>
    </div>
  `).join("");
}

function openStepsModal() {
  const user = getUserData();
  const timeInp = document.getElementById("input-steps-time");
  if (timeInp) {
    const now = new Date();
    timeInp.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  renderStepsUI(user);
  openModal("steps-logger-modal");
}

function closeStepsModal() {
  closeModal("steps-logger-modal");
}

function quickAddSteps(amount) {
  const inp = document.getElementById("input-custom-steps");
  if (inp) inp.value = amount;
}

function handleStepsLogSubmit(e) {
  e.preventDefault();
  const countInp = document.getElementById("input-custom-steps");
  const timeInp = document.getElementById("input-steps-time");
  const actInp = document.getElementById("select-steps-activity");

  const count = parseInt(countInp?.value) || 1000;
  const time = timeInp?.value.trim() || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const label = actInp?.value || "Daily Walk 🚶";

  const user = getUserData();
  user.steps = (user.steps || 7842) + count;
  if (!user.stepLogs) user.stepLogs = [];
  user.stepLogs.push({ id: Date.now(), time, label, count });

  saveUserData(user);
  renderStepsUI(user);
  renderOverviewMetrics(user);

  playTimerBeep(659, 0.12, 'sine');
  showToast(`Logged +${count.toLocaleString()} steps at ${time}! Total: ${user.steps.toLocaleString()} steps 👟`);
}

function handleDirectStepsOverride() {
  const countInp = document.getElementById("input-custom-steps");
  const count = parseInt(countInp?.value);
  if (isNaN(count) || count < 0) {
    alert("Please enter a valid step count.");
    return;
  }

  const user = getUserData();
  user.steps = count;
  if (!user.stepLogs) user.stepLogs = [];
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  user.stepLogs.push({ id: Date.now(), time: nowStr, label: "Direct Set 📱", count });

  saveUserData(user);
  renderStepsUI(user);
  renderOverviewMetrics(user);

  playTimerBeep(523, 0.12, 'sine');
  showToast(`Total steps set to ${count.toLocaleString()}! 👟`);
}

function removeStepLog(idx) {
  const user = getUserData();
  if (!user.stepLogs) return;
  const removed = user.stepLogs.splice(idx, 1)[0];
  if (removed) {
    user.steps = Math.max(0, (user.steps || 0) - (removed.count || 0));
    saveUserData(user);
    renderStepsUI(user);
    renderOverviewMetrics(user);
    showToast(`Removed ${removed.label} (-${removed.count.toLocaleString()} steps)`);
  }
}

function resetTodayStepsLog() {
  if (confirm("Reset today's step count back to 0?")) {
    const user = getUserData();
    user.steps = 0;
    user.stepLogs = [];
    saveUserData(user);
    renderStepsUI(user);
    renderOverviewMetrics(user);
    showToast("Daily steps reset to 0! 👟");
  }
}

// Navigate from Overview Sleep Card to Wellness Section
function navigateToWellnessSleep() {
  const wellnessBtn = document.querySelector('[data-target="section-wellness"]');
  if (wellnessBtn) {
    wellnessBtn.click();
    setTimeout(() => {
      const sleepCard = document.querySelector('.sleep-logger-box');
      if (sleepCard) {
        sleepCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const hrsInput = document.getElementById("input-sleep-hours");
        if (hrsInput) {
          hrsInput.focus();
          hrsInput.style.outline = "3px solid var(--primary)";
          setTimeout(() => hrsInput.style.outline = "", 1500);
        }
      }
    }, 200);
  }
}

// --- WELLNESS MODULE: SLEEP, HYDRATION & MOOD-DRIVEN STRESS ---
function initWellnessModule(user) {
  // Sleep Logger Initialization
  const sleepHrsInp = document.getElementById("input-sleep-hours");
  const sleepQualInp = document.getElementById("input-sleep-quality");
  if (sleepHrsInp) sleepHrsInp.value = user.sleep || 7.5;
  if (sleepQualInp) sleepQualInp.value = user.sleepQuality || 88;

  const sleepHrsEl = document.getElementById("wellness-sleep-hours");
  const sleepQualEl = document.getElementById("wellness-sleep-quality");
  const sleepBar = document.getElementById("wellness-sleep-bar");
  if (sleepHrsEl) sleepHrsEl.textContent = user.sleep || 7.5;
  if (sleepQualEl) sleepQualEl.textContent = `(${user.sleepQuality || 88}% Quality)`;
  if (sleepBar) sleepBar.style.width = `${user.sleepQuality || 88}%`;

  // Hydration Initialization
  updateWellnessHydrationUI(user.water || 1.8);

  // Mood & Stress Initialization
  applyMoodStressCalibration(user.mood || "Great", false);
}

// User-Maintained Sleep Logging
function saveUserSleepLog() {
  const hoursInp = document.getElementById("input-sleep-hours");
  const qualInp = document.getElementById("input-sleep-quality");

  const hours = parseFloat(hoursInp?.value) || 7.5;
  const quality = parseInt(qualInp?.value) || 88;

  const user = getUserData();
  user.sleep = hours;
  user.sleepQuality = quality;
  saveUserData(user);

  // Update wellness UI
  const sleepHrsEl = document.getElementById("wellness-sleep-hours");
  const sleepQualEl = document.getElementById("wellness-sleep-quality");
  const sleepBar = document.getElementById("wellness-sleep-bar");

  if (sleepHrsEl) sleepHrsEl.textContent = hours;
  if (sleepQualEl) sleepQualEl.textContent = `(${quality}% Quality)`;
  if (sleepBar) sleepBar.style.width = `${quality}%`;

  // Update Overview Metric
  renderOverviewMetrics(user);

  playTimerBeep(523, 0.12, 'sine');
  showToast(`Sleep record updated: ${hours} hrs (${quality}% rest) maintained by you! 🌙`);
}

// Customized Water Adding & Removing
function addWaterCustom(liters) {
  const user = getUserData();
  user.water = parseFloat(((user.water || 1.8) + liters).toFixed(2));
  saveUserData(user);

  renderOverviewMetrics(user);
  updateWellnessHydrationUI(user.water);
  playTimerBeep(659, 0.1, 'sine');
  showToast(`Added ${(liters * 1000).toFixed(0)}ml water! Total: ${user.water.toFixed(2)} L 💧`);
}

function removeWaterCustom(liters) {
  const user = getUserData();
  user.water = Math.max(0, parseFloat(((user.water || 1.8) - liters).toFixed(2)));
  saveUserData(user);

  renderOverviewMetrics(user);
  updateWellnessHydrationUI(user.water);
  playTimerBeep(440, 0.1, 'sine');
  showToast(`Removed ${(liters * 1000).toFixed(0)}ml water. Total: ${user.water.toFixed(2)} L 💧`);
}

function addCustomWaterInput() {
  const inp = document.getElementById("water-custom-ml");
  const ml = parseInt(inp?.value) || 250;
  addWaterCustom(ml / 1000);
}

function removeCustomWaterInput() {
  const inp = document.getElementById("water-custom-ml");
  const ml = parseInt(inp?.value) || 250;
  removeWaterCustom(ml / 1000);
}

function toggleWaterCup(cupIndex) {
  const cups = document.querySelectorAll(".water-cup-btn");
  cups.forEach((c, idx) => {
    if (idx <= cupIndex) {
      c.classList.add("filled");
    } else {
      c.classList.remove("filled");
    }
  });

  const user = getUserData();
  user.water = parseFloat(((cupIndex + 1) * 0.35).toFixed(2));
  saveUserData(user);
  renderOverviewMetrics(user);
  updateWellnessHydrationUI(user.water);
  playTimerBeep(587, 0.1, 'sine');
  showToast(`Water updated to ${user.water.toFixed(2)} L! 💧`);
}

function updateWellnessHydrationUI(waterAmount) {
  const valEl = document.getElementById("wellness-water-val");
  const pctEl = document.getElementById("wellness-water-pct");
  const target = 3.0;

  if (valEl) valEl.textContent = `${waterAmount.toFixed(2)} / ${target.toFixed(1)} L`;
  const pct = Math.round((waterAmount / target) * 100);
  if (pctEl) {
    pctEl.textContent = `${pct}% Met`;
    if (pct >= 100) {
      pctEl.className = "badge badge-green";
      pctEl.textContent = "100% Met 🎉";
    }
  }

  const count = Math.min(8, Math.round(waterAmount / 0.35));
  const cups = document.querySelectorAll(".water-cup-btn");
  cups.forEach((c, idx) => {
    if (idx < count) {
      c.classList.add("filled");
    } else {
      c.classList.remove("filled");
    }
  });
}

// Daily Stress Tracker Based On Mood (User explicitly requested!)
function setDailyMood(moodName, element) {
  const moodBtns = document.querySelectorAll(".mood-btn");
  moodBtns.forEach(btn => btn.classList.remove("selected"));
  if (element) {
    element.classList.add("selected");
  } else {
    const targetBtn = document.getElementById(`mood-btn-${moodName}`);
    if (targetBtn) targetBtn.classList.add("selected");
  }

  applyMoodStressCalibration(moodName, true);
}

function applyMoodStressCalibration(moodName, showUserToast = true) {
  const user = getUserData();
  user.mood = moodName;

  let score = 24;
  let badgeText = "Low Stress";
  let badgeColor = "var(--primary)";
  let descText = "Optimal recovery zone. Ideal readiness for heavy strength or athletic conditioning today.";
  let stressAdaptLevel = "low";

  if (moodName === "Great") {
    score = 18;
    badgeText = "Low Stress (Optimal)";
    badgeColor = "var(--primary)";
    descText = "Peak central nervous recovery! High Heart Rate Variability indicates maximum physical readiness.";
    stressAdaptLevel = "low";
  } else if (moodName === "Good") {
    score = 34;
    badgeText = "Mild Stress (Balanced)";
    badgeColor = "#10B981";
    descText = "Balanced autonomic nervous state. Great day for consistent strength sets and progressive cardio.";
    stressAdaptLevel = "low";
  } else if (moodName === "Zen") {
    score = 12;
    badgeText = "Zen (Deep Recovery)";
    badgeColor = "#059669";
    descText = "Parasympathetic recovery state. Restorative mobility and parasympathetic breathing are ideal.";
    stressAdaptLevel = "low";
  } else if (moodName === "Pumped") {
    score = 20;
    badgeText = "High Drive / Pumped";
    badgeColor = "#7C3AED";
    descText = "Elevated focus and adrenaline! Optimal day for high-volume resistance and athletic performance.";
    stressAdaptLevel = "low";
  } else if (moodName === "Neutral") {
    score = 52;
    badgeText = "Moderate Stress";
    badgeColor = "#F59E0B";
    descText = "Balanced fatigue detected. Maintain steady-state aerobic tempo without overloading spinal joints.";
    stressAdaptLevel = "moderate";
  } else if (moodName === "Tired") {
    score = 70;
    badgeText = "High Fatigue Alert";
    badgeColor = "#EA580C";
    descText = "Central fatigue and depleted energy detected. Prioritize hydration and 8 hours of sleep tonight.";
    stressAdaptLevel = "high";
  } else if (moodName === "Stressed") {
    score = 88;
    badgeText = "High Cortisol Alert";
    badgeColor = "#EF4444";
    descText = "Elevated stress detected. Intense exercise is paused. Practice the Guided Breathing Studio below.";
    stressAdaptLevel = "high";
  }

  user.stressScore = score;
  saveUserData(user);

  // Update UI Elements
  const moodNameEl = document.getElementById("current-mood-name");
  if (moodNameEl) moodNameEl.textContent = `Feeling ${moodName}! ✨`;

  const scoreEl = document.getElementById("wellness-stress-score");
  const badgeEl = document.getElementById("wellness-stress-badge");
  const barEl = document.getElementById("wellness-stress-bar");
  const descEl = document.getElementById("wellness-stress-desc");
  const sliderEl = document.getElementById("custom-stress-slider");
  const sliderVal = document.getElementById("stress-slider-val");

  if (scoreEl) scoreEl.textContent = `${score} / 100`;
  if (sliderEl) sliderEl.value = score;
  if (sliderVal) sliderVal.textContent = `${score} / 100`;

  if (badgeEl) {
    badgeEl.textContent = badgeText;
    badgeEl.style.background = badgeColor;
    badgeEl.style.color = "#FFFFFF";
  }
  if (barEl) {
    barEl.style.width = `${score}%`;
    barEl.style.background = badgeColor;
  }
  if (descEl) descEl.textContent = descText;

  // Sync with Workout Adaptation Planner
  if (typeof applyStressAdaptation === "function") {
    applyStressAdaptation(stressAdaptLevel);
  }

  // Sync with Live Today Scenario Archive
  if (typeof syncLiveTodayScenario === "function") {
    syncLiveTodayScenario(false);
  }

  if (showUserToast) {
    playTimerBeep(520, 0.1, 'sine');
    showToast(`Mood: ${moodName} 😊 Daily stress calibrated to ${score}/100! 🧘`);
  }
}

// User-customized fine-tuning slider for stress
function onCustomStressSliderChange(val) {
  const score = parseInt(val) || 24;
  const user = getUserData();
  user.stressScore = score;
  saveUserData(user);

  const sliderVal = document.getElementById("stress-slider-val");
  const scoreEl = document.getElementById("wellness-stress-score");
  const badgeEl = document.getElementById("wellness-stress-badge");
  const barEl = document.getElementById("wellness-stress-bar");
  const descEl = document.getElementById("wellness-stress-desc");

  if (sliderVal) sliderVal.textContent = `${score} / 100`;
  if (scoreEl) scoreEl.textContent = `${score} / 100`;
  if (barEl) barEl.style.width = `${score}%`;

  let badgeText = "Custom Stress";
  let badgeColor = "var(--primary)";
  let descText = "Customized daily stress level recorded.";
  let stressAdaptLevel = "low";

  if (score <= 25) {
    badgeText = "Low Stress (Peak Restored)";
    badgeColor = "var(--primary)";
    descText = "Optimal autonomic balance. Prime physical condition for athletic or compound lifting.";
    stressAdaptLevel = "low";
  } else if (score <= 45) {
    badgeText = "Mild Stress (Balanced)";
    badgeColor = "#10B981";
    descText = "Stable energy reserves. Good state for progressive workouts and steady cardio pacing.";
    stressAdaptLevel = "low";
  } else if (score <= 65) {
    badgeText = "Moderate Stress";
    badgeColor = "#F59E0B";
    descText = "Moderate nervous strain. Focus on controlled tempos, hydration, and avoiding joint stress.";
    stressAdaptLevel = "moderate";
  } else {
    badgeText = "High Stress / Cortisol Alert";
    badgeColor = "#EF4444";
    descText = "High stress detected. Lower resistance volume, focus on spinal mobility and deep breathing.";
    stressAdaptLevel = "high";
  }

  if (badgeEl) {
    badgeEl.textContent = badgeText;
    badgeEl.style.background = badgeColor;
  }
  if (barEl) barEl.style.background = badgeColor;
  if (descEl) descEl.textContent = descText;

  if (typeof applyStressAdaptation === "function") {
    applyStressAdaptation(stressAdaptLevel);
  }
  if (typeof syncLiveTodayScenario === "function") {
    syncLiveTodayScenario(false);
  }
}

function toggleMoodTag(btn, tagName) {
  if (btn) btn.classList.toggle("active");
}

function saveCustomDailyMoodAndStress() {
  const user = getUserData();
  const noteInp = document.getElementById("input-mood-reflection");
  const activeTags = [];
  document.querySelectorAll("#mood-driver-tags .preset-pill.active").forEach(el => {
    activeTags.push(el.textContent.trim());
  });

  user.moodTags = activeTags;
  if (noteInp && noteInp.value.trim()) {
    user.moodNote = noteInp.value.trim();
  }

  saveUserData(user);
  if (typeof syncLiveTodayScenario === "function") {
    syncLiveTodayScenario(false);
  }

  playTimerBeep(659, 0.15, 'sine');
  showToast(`Today's customized mood (${user.mood || 'Great'}) & stress scenario saved to your account! 🧘`);
}

// --- CUSTOMIZABLE GUIDED BREATHING & MEDITATION STUDIO (WELLNESS PAGE) ---
let breatheInhaleSec = 4;
let breatheHoldSec = 4;
let breatheExhaleSec = 4;
let breathePhase = "inhale"; // 'inhale' | 'hold' | 'exhale'
let breathePhaseRemaining = 4;
let breatheTotalElapsed = 0;
let breatheSessionRemaining = 120; // 2 minutes default
let breatheCycles = 0;
let isBreathingRunning = false;
let breathingTimerId = null;

function initBreathingStudio() {
  updateBreathingUI();
}

function onCustomBreathingInputChange() {
  const inhInp = document.getElementById("breathe-custom-inhale");
  const hldInp = document.getElementById("breathe-custom-hold");
  const exhInp = document.getElementById("breathe-custom-exhale");

  breatheInhaleSec = Math.max(2, parseInt(inhInp?.value) || 4);
  breatheHoldSec = Math.max(0, parseInt(hldInp?.value) || 0);
  breatheExhaleSec = Math.max(2, parseInt(exhInp?.value) || 4);

  // Sync to modal inputs as well
  const mInh = document.getElementById("modal-custom-inhale");
  const mHld = document.getElementById("modal-custom-hold");
  const mExh = document.getElementById("modal-custom-exhale");
  if (mInh) mInh.value = breatheInhaleSec;
  if (mHld) mHld.value = breatheHoldSec;
  if (mExh) mExh.value = breatheExhaleSec;

  if (!isBreathingRunning) {
    breathePhaseRemaining = breatheInhaleSec;
    updateBreathingUI();
  }
  showToast(`Custom breath configured: Inhale ${breatheInhaleSec}s • Hold ${breatheHoldSec}s • Exhale ${breatheExhaleSec}s 🌬️`);
}

function syncModalCustomBreathing() {
  const mInh = document.getElementById("modal-custom-inhale");
  const mHld = document.getElementById("modal-custom-hold");
  const mExh = document.getElementById("modal-custom-exhale");

  breatheInhaleSec = Math.max(2, parseInt(mInh?.value) || 4);
  breatheHoldSec = Math.max(0, parseInt(mHld?.value) || 0);
  breatheExhaleSec = Math.max(2, parseInt(mExh?.value) || 4);

  // Sync to inline inputs
  const inhInp = document.getElementById("breathe-custom-inhale");
  const hldInp = document.getElementById("breathe-custom-hold");
  const exhInp = document.getElementById("breathe-custom-exhale");
  if (inhInp) inhInp.value = breatheInhaleSec;
  if (hldInp) hldInp.value = breatheHoldSec;
  if (exhInp) exhInp.value = breatheExhaleSec;

  if (!isBreathingRunning) {
    breathePhaseRemaining = breatheInhaleSec;
    updateBreathingUI();
  }
  showToast(`Custom breath configured: Inhale ${breatheInhaleSec}s • Hold ${breatheHoldSec}s • Exhale ${breatheExhaleSec}s 🌬️`);
}

function applyBreathingPreset(inh, hld, exh, name) {
  breatheInhaleSec = inh;
  breatheHoldSec = hld;
  breatheExhaleSec = exh;

  // Update inputs
  ["breathe-custom-inhale", "modal-custom-inhale"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = inh;
  });
  ["breathe-custom-hold", "modal-custom-hold"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = hld;
  });
  ["breathe-custom-exhale", "modal-custom-exhale"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = exh;
  });

  resetBreathingSession();
  playTimerBeep(523, 0.15, 'sine');
  showToast(`Applied ${name}! Inhale ${inh}s • Hold ${hld}s • Exhale ${exh}s 🌬️`);
}

function toggleBreathingSession() {
  if (isBreathingRunning) {
    pauseBreathingSession();
  } else {
    startBreathingSession();
  }
}

function startBreathingSession() {
  isBreathingRunning = true;

  const playBtn = document.getElementById("breathe-play-btn");
  const modalPlayBtn = document.getElementById("modal-breathe-play-btn");
  if (playBtn) playBtn.textContent = "⏸ Pause Breathing";
  if (modalPlayBtn) modalPlayBtn.textContent = "⏸ Pause Breathing";

  // Play soothing start chime
  playBreathingChime("inhale");

  if (breathingTimerId) clearInterval(breathingTimerId);

  breathingTimerId = setInterval(() => {
    breathePhaseRemaining--;
    breatheSessionRemaining--;

    if (breatheSessionRemaining <= 0) {
      finishBreathingSession();
      return;
    }

    if (breathePhaseRemaining <= 0) {
      advanceBreathingPhase();
    }

    updateBreathingUI();
  }, 1000);

  updateBreathingUI();
}

function pauseBreathingSession() {
  isBreathingRunning = false;
  if (breathingTimerId) {
    clearInterval(breathingTimerId);
    breathingTimerId = null;
  }

  const playBtn = document.getElementById("breathe-play-btn");
  const modalPlayBtn = document.getElementById("modal-breathe-play-btn");
  if (playBtn) playBtn.textContent = "▶ Resume Breathing";
  if (modalPlayBtn) modalPlayBtn.textContent = "▶ Resume Breathing";

  const statusEl = document.getElementById("breathe-status-lbl");
  if (statusEl) statusEl.textContent = "Session Paused ⏸";
}

function resetBreathingSession() {
  pauseBreathingSession();
  breathePhase = "inhale";
  breathePhaseRemaining = breatheInhaleSec;
  breatheSessionRemaining = 120;
  breatheCycles = 0;

  const playBtn = document.getElementById("breathe-play-btn");
  const modalPlayBtn = document.getElementById("modal-breathe-play-btn");
  if (playBtn) playBtn.textContent = "▶ Start Breathing";
  if (modalPlayBtn) modalPlayBtn.textContent = "▶ Start Breathing";

  updateBreathingUI();
}

function advanceBreathingPhase() {
  if (breathePhase === "inhale") {
    if (breatheHoldSec > 0) {
      breathePhase = "hold";
      breathePhaseRemaining = breatheHoldSec;
    } else {
      breathePhase = "exhale";
      breathePhaseRemaining = breatheExhaleSec;
    }
  } else if (breathePhase === "hold") {
    breathePhase = "exhale";
    breathePhaseRemaining = breatheExhaleSec;
  } else if (breathePhase === "exhale") {
    breathePhase = "inhale";
    breathePhaseRemaining = breatheInhaleSec;
    breatheCycles++;
  }

  playBreathingChime(breathePhase);
}

function playBreathingChime(phase) {
  if (isAudioMuted) return;
  try {
    if (phase === "inhale") {
      playTimerBeep(440, 0.25, 'sine');
      setTimeout(() => playTimerBeep(554, 0.35, 'sine'), 140);
    } else if (phase === "hold") {
      playTimerBeep(523, 0.2, 'sine');
    } else if (phase === "exhale") {
      playTimerBeep(554, 0.25, 'sine');
      setTimeout(() => playTimerBeep(392, 0.35, 'sine'), 140);
    }
  } catch (e) {}
}

function updateBreathingUI() {
  const phaseTxt = document.getElementById("breathe-phase-txt");
  const phaseSec = document.getElementById("breathe-phase-sec");
  const bubble = document.getElementById("breathe-interactive-bubble");
  const statusEl = document.getElementById("breathe-status-lbl");
  const clockEl = document.getElementById("breathe-session-clock");
  const cyclesBadge = document.getElementById("breathe-cycles-badge");

  // Modal elements
  const mPhaseTxt = document.getElementById("modal-breathe-phase-txt");
  const mPhaseSec = document.getElementById("modal-breathe-phase-sec");
  const mBubble = document.getElementById("modal-breathe-bubble");
  const mClock = document.getElementById("modal-breathe-clock");
  const mCycleCount = document.getElementById("modal-breathe-cycle-count");
  const mInstruction = document.getElementById("modal-breathe-instruction");
  const mRing = document.getElementById("modal-breathe-ring");

  // Phase Title Capitalized
  const phaseTitle = breathePhase.charAt(0).toUpperCase() + breathePhase.slice(1);
  if (phaseTxt) phaseTxt.textContent = phaseTitle;
  if (phaseSec) phaseSec.textContent = `${breathePhaseRemaining}s`;

  if (mPhaseTxt) mPhaseTxt.textContent = phaseTitle;
  if (mPhaseSec) mPhaseSec.textContent = `${breathePhaseRemaining}s`;

  // Formatting clock mm:ss
  const mins = Math.floor(breatheSessionRemaining / 60);
  const secs = breatheSessionRemaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  if (clockEl) clockEl.textContent = timeStr;
  if (mClock) mClock.textContent = timeStr;

  if (cyclesBadge) cyclesBadge.textContent = `${breatheCycles} Cycles`;
  if (mCycleCount) mCycleCount.textContent = breatheCycles;

  // Active status description
  let guideText = "Ready to Breathe";
  if (isBreathingRunning) {
    if (breathePhase === "inhale") guideText = "Inhale slowly through your nose... 🌿";
    else if (breathePhase === "hold") guideText = "Hold gently... Retain calmness ✨";
    else if (breathePhase === "exhale") guideText = "Exhale smoothly through your mouth... 🌬️";
  }
  if (statusEl) statusEl.textContent = guideText;
  if (mInstruction) mInstruction.textContent = guideText;

  // Bubble animation class toggle
  [bubble, mBubble].forEach(b => {
    if (!b) return;
    b.classList.remove("inhale", "hold", "exhale");
    if (isBreathingRunning) {
      b.classList.add(breathePhase);
    }
  });

  // Modal Ring Countdown offset
  if (mRing) {
    let maxSec = breatheInhaleSec;
    if (breathePhase === "hold") maxSec = Math.max(1, breatheHoldSec);
    else if (breathePhase === "exhale") maxSec = breatheExhaleSec;

    const ringCircumference = 660; // 2 * PI * 105
    const frac = Math.max(0, breathePhaseRemaining / maxSec);
    mRing.style.strokeDashoffset = ringCircumference - (ringCircumference * frac);

    if (breathePhase === "inhale") mRing.style.stroke = "var(--primary)";
    else if (breathePhase === "hold") mRing.style.stroke = "#F59E0B";
    else mRing.style.stroke = "#3B82F6";
  }
}

function finishBreathingSession() {
  pauseBreathingSession();
  playWorkoutFanfare();
  showToast(`🎉 Breathing session complete! Completed ${breatheCycles} cycles of mindful relaxation! 🌿`);
}

function openZenBreathingModal() {
  openModal("zen-breathing-modal");
  updateBreathingUI();
}

function closeZenBreathingModal() {
  closeModal("zen-breathing-modal");
}

// Setup AI Coach Chat Engine
function setupAICoach(user) {
  const chatInput = document.getElementById("ai-coach-input");
  const sendBtn = document.getElementById("ai-coach-send-btn");
  const chatBody = document.getElementById("ai-coach-chat-body");

  if (!chatInput || !sendBtn || !chatBody) return;

  function sendMessage() {
    const query = chatInput.value.trim();
    if (!query) return;

    // Append user bubble
    appendChatBubble(query, "user");
    chatInput.value = "";

    // Show AI typing indicator
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "chat-bubble bot-bubble";
    typingIndicator.id = "coach-typing";
    typingIndicator.innerHTML = `
      <div class="bubble-avatar">AI</div>
      <div class="bubble-content" style="font-style:italic;color:var(--text-muted);">
        MetaAI Coach is typing...
      </div>
    `;
    chatBody.appendChild(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Generate response after small delay for realism
    setTimeout(() => {
      const indicator = document.getElementById("coach-typing");
      if (indicator) indicator.remove();
      
      const response = generateAIResponse(query, user);
      appendChatBubble(response, "bot");
    }, 700);
  }

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}

// Quick Prompt click
function sendQuickPrompt(promptText) {
  const chatInput = document.getElementById("ai-coach-input");
  if (chatInput) {
    chatInput.value = promptText;
    const sendBtn = document.getElementById("ai-coach-send-btn");
    if (sendBtn) sendBtn.click();
  }
}

// Append Chat Bubble to Chat Container
function appendChatBubble(text, sender = "bot") {
  const chatBody = document.getElementById("ai-coach-chat-body");
  if (!chatBody) return;

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${sender === "bot" ? "bot-bubble" : "user-bubble"}`;
  
  const avatarLetter = sender === "bot" ? "AI" : "You";
  bubble.innerHTML = `
    <div class="bubble-avatar">${avatarLetter}</div>
    <div class="bubble-content">${text}</div>
  `;
  chatBody.appendChild(bubble);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// AI Coach Predefined Keyword Analysis Engine
function generateAIResponse(query, user) {
  const q = query.toLowerCase();

  if (q.includes("workout") || q.includes("exercise") || q.includes("training") || q.includes("today")) {
    return `Hi <strong>${user.name}</strong>! Based on your <em>${user.fitnessGoal}</em> goal and current activity, I recommend a <strong>35-minute Upper Body & Core routine</strong> today. Warm up with 5 mins of arm circles and high knees, then hit 3 sets of dumbbell rows, push-ups, and planks! 💪`;
  }
  
  if (q.includes("eat") || q.includes("food") || q.includes("nutrition") || q.includes("diet") || q.includes("lunch") || q.includes("dinner")) {
    return `For optimal recovery with your <em>${user.dietPreference}</em> preference, aim for a balanced plate: 40% complex carbs (brown rice/quinoa), 30% lean protein (tofu/paneer/lentils/chicken), and 30% leafy greens. Remember your target is around <strong>${user.targetCalories || 2100} kcal</strong> today! 🥗`;
  }
  
  if (q.includes("water") || q.includes("hydration") || q.includes("drink")) {
    return `Hydration is key for peak performance! You're currently at <strong>${(user.water || 1.8).toFixed(1)} L</strong>. Your personalized daily target is <strong>${(user.targetWater || 3.0)} L</strong>. Try having one glass right now to boost your energy! 💧`;
  }
  
  if (q.includes("sleep") || q.includes("rest") || q.includes("tired")) {
    return `Quality sleep drives muscle recovery and cognitive clarity. You logged <strong>${user.sleep || 7.5} hrs</strong> last night. To optimize deep sleep: avoid screens 45 minutes before bedtime, keep your room cool, and try 5 minutes of mindful breathing. 🌙`;
  }

  if (q.includes("sore") || q.includes("pain") || q.includes("recovery") || q.includes("stiff")) {
    return `Muscle soreness (DOMS) is common after intense exercise! Make sure you gently stretch for 10 minutes, take an electrolyte-rich drink, and consider a light walking session to promote blood circulation. 🧘`;
  }

  if (q.includes("motivation") || q.includes("tired") || q.includes("give up")) {
    return `Remember why you started, <strong>${user.name}</strong>! Every workout and healthy meal compounds over time. You've already completed <strong>${user.workoutsCompleted || 12} workouts</strong> this month. Keep going! 🚀`;
  }

  // Default intelligent assistant response
  return `That's a great question, <strong>${user.name}</strong>! For your goal of <em>${user.fitnessGoal}</em>, staying consistent with progressive overload, adequate hydration, and whole-food nutrition will yield the best results. What specific aspect of your plan can I help clarify?`;
}

// Render Profile Form in Profile Tab
function renderProfileForm(user) {
  const nameInp = document.getElementById("profile-name");
  const emailInp = document.getElementById("profile-email");
  const goalInp = document.getElementById("profile-goal");
  const levelInp = document.getElementById("profile-level");
  const heightInp = document.getElementById("profile-height");
  const weightInp = document.getElementById("profile-weight");
  const activityInp = document.getElementById("profile-activity");

  if (nameInp) nameInp.value = user.name || "Bhavya";
  if (emailInp) emailInp.value = user.email || "bhavya@metaaifit.com";
  if (goalInp) goalInp.value = user.fitnessGoal || "Improve Fitness";
  if (levelInp) levelInp.value = user.fitnessLevel || "Intermediate";
  if (heightInp) heightInp.value = user.height || 165;
  if (weightInp) weightInp.value = user.weight || 60;
  if (activityInp) activityInp.value = user.activityLevel || "Moderately Active";

  const form = document.getElementById("profile-edit-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      user.name = nameInp.value.trim() || user.name;
      user.email = emailInp.value.trim() || user.email;
      user.fitnessGoal = goalInp.value;
      user.fitnessLevel = levelInp.value;
      user.height = parseFloat(heightInp.value) || user.height;
      user.weight = parseFloat(weightInp.value) || user.weight;
      user.activityLevel = activityInp.value;

      saveUserData(user);
      renderDashboardHeader(user);
      showToast("Profile details updated successfully! ✅");
    });
  }
}

// View Achievement Details Modal
function viewBadgeDetails(badgeName, badgeDesc) {
  showToast(`Achievement: ${badgeName} — ${badgeDesc} 🏆`);
}

// Logout Function
function handleLogout() {
  if (confirm("Are you sure you want to log out of MetaAI Fit?")) {
    setLoggedIn(false);
    showToast("Logged out successfully. Redirecting...");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 400);
  }
}

// =========================================================================
// 30-DAY DAILY HEALTH SCENARIOS & NUTRITION ARCHIVE (TIED TO USER LOGIN)
// =========================================================================
function getScenarioArchiveStorageKey(user) {
  const accountEmail = user?.email || "bhavyasrilalam1@gmail.com";
  return `metaai_scenario_archive_${accountEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}

let activeSelectedScenarioDate = null;
let currentArchiveFilter = "all"; // 'all' | '7days' | 'today'

function initScenarioArchiveModule(user) {
  const storageKey = getScenarioArchiveStorageKey(user);
  let archive = [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      archive = JSON.parse(raw);
    }
  } catch (e) {
    archive = [];
  }

  // Pre-seed 30 days of authentic daily scenarios if not already stored
  if (!archive || archive.length < 25) {
    archive = generate30DayHistoricalScenarios(user);
    try {
      localStorage.setItem(storageKey, JSON.stringify(archive));
    } catch (e) {}
  }

  // Ensure today's entry (index 0) has live updated user data
  updateTodayScenarioFromUser(archive, user);
  try {
    localStorage.setItem(storageKey, JSON.stringify(archive));
  } catch (e) {}

  const accountBadge = document.getElementById("archive-login-badge");
  if (accountBadge) {
    accountBadge.textContent = `Account: ${user.email || 'bhavyasrilalam1@gmail.com'}`;
  }

  if (!activeSelectedScenarioDate && archive.length > 0) {
    activeSelectedScenarioDate = archive[0].date;
  }

  renderArchiveUI(archive);
}

// Generate realistic, detailed records across the past 30 days
function generate30DayHistoricalScenarios(user) {
  const list = [];
  const baseDate = new Date(2026, 9, 2); // Oct 2, 2026

  const sampleWorkouts = [
    { name: "Full Body Strength", dur: "45 min", kcal: 360 },
    { name: "Cardio Training", dur: "30 min", kcal: 280 },
    { name: "Athletic Conditioning", dur: "35 min", kcal: 420 },
    { name: "Core Workout", dur: "20 min", kcal: 180 },
    { name: "Stretching & Mobility", dur: "25 min", kcal: 110 }
  ];

  const sampleMoods = [
    { mood: "Great 😊", score: 18, status: "Low Stress (Peak Readiness)", note: "Felt strong and completely recovered" },
    { mood: "Good 🙂", score: 28, status: "Mild Stress (Balanced)", note: "Smooth steady state training session" },
    { mood: "Pumped ⚡", score: 20, status: "High Drive / Pumped", note: "Hit personal best cadence on intervals" },
    { mood: "Zen 🧘", score: 14, status: "Zen (Deep Recovery)", note: "Mindful breathing and spinal decompression" },
    { mood: "Neutral 😐", score: 48, status: "Moderate Stress", note: "Busy workday with steady evening walk" },
    { mood: "Tired 🥱", score: 65, status: "High Fatigue Alert", note: "Prioritized hydration and early sleep" }
  ];

  for (let i = 0; i < 30; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString("en-US", { weekday: 'short' });
    const fullDate = d.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
    const isToday = (i === 0);

    const m = sampleMoods[i % sampleMoods.length];
    const w = sampleWorkouts[i % sampleWorkouts.length];

    // Varied nutrition meals
    const consumed = isToday ? (user.nutrition?.consumedKcal || 1640) : (1720 + ((i * 47) % 380));
    const protein = isToday ? (user.nutrition?.protein || 120) : (115 + ((i * 9) % 38));
    const steps = isToday ? (user.steps || 7842) : (7200 + ((i * 380) % 4100));
    const sleepHrs = isToday ? (user.sleep || 7.5) : (7.0 + ((i % 4) * 0.4));
    const sleepQual = isToday ? (user.sleepQuality || 88) : (82 + ((i * 5) % 15));
    const waterL = isToday ? (user.water || 1.8) : (2.1 + ((i % 5) * 0.25));

    const dayScenario = {
      date: dateStr,
      displayDate: isToday ? `Today, ${fullDate}` : `${dayName}, ${fullDate}`,
      dayOfWeek: d.toLocaleDateString("en-US", { weekday: 'long' }),
      isToday: isToday,
      mood: isToday ? (user.mood || "Great 😊") : m.mood,
      moodNote: isToday ? (user.moodNote || "Feeling primed and well-rested") : m.note,
      moodTags: isToday ? (user.moodTags || ["Workout 🏋️", "Good Sleep 😴"]) : ["Workout 🏋️", "Healthy Diet 🥗"],
      stressScore: isToday ? (user.stressScore || 24) : m.score,
      stressStatus: m.status,
      nutrition: {
        consumedKcal: consumed,
        targetKcal: 2100,
        protein: protein,
        proteinTarget: 150,
        carbs: Math.round(consumed * 0.45 / 4),
        fats: Math.round(consumed * 0.25 / 9),
        loggedMeals: isToday ? (user.nutrition?.loggedMeals || [
          { type: "Breakfast", name: "Oatmeal & Fruits", kcal: 380, protein: 14, time: "08:30 AM" },
          { type: "Lunch", name: "Rice & Grilled Vegetables", kcal: 560, protein: 28, time: "01:15 PM" },
          { type: "Dinner", name: "Protein Bowl", kcal: 620, protein: 42, time: "07:30 PM" },
          { type: "Snacks", name: "Greek Yogurt & Almonds", kcal: 180, protein: 12, time: "04:45 PM" }
        ]) : [
          { type: "Breakfast", name: "Oatmeal & Fruits", kcal: 380, protein: 14, time: "08:15 AM" },
          { type: "Lunch", name: "Grilled Chicken & Quinoa", kcal: 540, protein: 36, time: "01:10 PM" },
          { type: "Dinner", name: "High-Protein Super Bowl", kcal: 610, protein: 44, time: "07:45 PM" },
          { type: "Snacks", name: "Greek Yogurt & Chia", kcal: 190, protein: 14, time: "04:30 PM" }
        ]
      },
      workout: {
        name: isToday ? "Full Body Strength & Core" : w.name,
        duration: isToday ? "45 min" : w.dur,
        burnedKcal: isToday ? (user.burnedCalories || 420) : w.kcal,
        completed: true
      },
      steps: {
        total: steps,
        target: 10000,
        logs: [
          { time: "07:45 AM", label: "Morning Walk 🌅", count: Math.round(steps * 0.4) },
          { time: "01:15 PM", label: "Midday Stroll ☀️", count: Math.round(steps * 0.3) },
          { time: "06:30 PM", label: "Evening Walk 🌙", count: Math.round(steps * 0.3) }
        ]
      },
      sleep: {
        hours: parseFloat(sleepHrs.toFixed(1)),
        quality: sleepQual
      },
      water: {
        liters: parseFloat(waterL.toFixed(2)),
        target: 3.0
      }
    };

    list.push(dayScenario);
  }

  return list;
}

// Keep Today's entry up-to-date with live session
function updateTodayScenarioFromUser(archive, user) {
  if (!archive || archive.length === 0) return;
  const todayEntry = archive[0];
  if (!todayEntry) return;

  todayEntry.mood = user.mood || "Great 😊";
  todayEntry.moodNote = user.moodNote || "Feeling primed and well-rested";
  todayEntry.moodTags = user.moodTags || ["Workout 🏋️", "Good Sleep 😴"];
  todayEntry.stressScore = user.stressScore || 24;

  if (user.nutrition) {
    todayEntry.nutrition.consumedKcal = user.nutrition.consumedKcal || 1640;
    todayEntry.nutrition.protein = user.nutrition.protein || 120;
    todayEntry.nutrition.carbs = user.nutrition.carbs || 180;
    todayEntry.nutrition.fats = user.nutrition.fats || 48;
    todayEntry.nutrition.loggedMeals = user.nutrition.loggedMeals || [];
  }

  todayEntry.workout.burnedKcal = user.burnedCalories || 420;
  todayEntry.steps.total = user.steps || 7842;
  todayEntry.steps.logs = user.stepLogs || todayEntry.steps.logs;
  todayEntry.sleep.hours = user.sleep || 7.5;
  todayEntry.sleep.quality = user.sleepQuality || 88;
  todayEntry.water.liters = user.water || 1.8;
}

// Sync Live Session into Account Archive whenever user modifies data
function syncLiveTodayScenario(showToastFeedback = false) {
  const user = getUserData();
  const storageKey = getScenarioArchiveStorageKey(user);
  let archive = [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) archive = JSON.parse(raw);
  } catch (e) {}

  if (!archive || archive.length === 0) {
    archive = generate30DayHistoricalScenarios(user);
  }

  updateTodayScenarioFromUser(archive, user);

  try {
    localStorage.setItem(storageKey, JSON.stringify(archive));
  } catch (e) {}

  renderArchiveUI(archive);

  if (showToastFeedback) {
    playTimerBeep(587, 0.15, 'sine');
    showToast(`Today's scenario snapshot permanently preserved in your account archive! 💾`);
  }
}

// Render the 30-Day Archive UI
function renderArchiveUI(archive) {
  if (!archive || archive.length === 0) return;

  // 1. Populate Dropdown
  const selectEl = document.getElementById("archive-date-select");
  if (selectEl) {
    selectEl.innerHTML = archive.map(d => `
      <option value="${d.date}" ${d.date === activeSelectedScenarioDate ? 'selected' : ''}>
        ${d.displayDate} (${d.mood})
      </option>
    `).join("");
  }

  // 2. Render Active Scenario Detail Card
  const activeDay = archive.find(d => d.date === activeSelectedScenarioDate) || archive[0];
  renderActiveScenarioDetail(activeDay);

  // 3. Render Timeline Cards Row
  renderArchiveTimelineCards(archive);
}

function renderActiveScenarioDetail(d) {
  const container = document.getElementById("active-scenario-detail-card");
  if (!container || !d) return;

  const n = d.nutrition || {};
  const meals = n.loggedMeals || [];
  const proPct = Math.round((n.protein / (n.proteinTarget || 150)) * 100);
  const calPct = Math.round((n.consumedKcal / (n.targetKcal || 2100)) * 100);

  const tagsHtml = (d.moodTags || []).map(t => `<span class="preset-pill active" style="font-size:0.7rem;padding:0.2rem 0.5rem;">${t}</span>`).join(" ");

  container.innerHTML = `
    <!-- Scenario Card Top Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:1.2rem;border-bottom:1px solid var(--border);padding-bottom:1rem;">
      <div>
        <div style="font-size:0.8rem;font-weight:700;color:var(--primary);text-transform:uppercase;">
          📅 ${d.dayOfWeek} Detailed Scenario Record ${d.isToday ? '• <span class="badge badge-green">Today (Live)</span>' : ''}
        </div>
        <h3 style="font-size:1.45rem;font-weight:800;color:var(--dark);margin-top:0.2rem;">
          ${d.displayDate}
        </h3>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.2rem;">
          ${d.moodNote ? `"${d.moodNote}"` : 'Regular training and nutrition day recorded in account.'}
        </p>
      </div>

      <!-- Mood & Stress Badge Box -->
      <div style="background:#FFFFFF;border:1px solid var(--border);border-radius:var(--radius-md);padding:0.8rem 1.2rem;text-align:right;">
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);">MOOD & STRESS SCORE</div>
        <div style="font-size:1.35rem;font-weight:800;color:var(--dark);margin-top:0.15rem;">
          ${d.mood} • <span style="color:${d.stressScore <= 35 ? 'var(--primary)' : '#F59E0B'};">${d.stressScore} / 100</span>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.2rem;">
          ${d.stressStatus || 'Optimal Readiness'}
        </div>
        <div style="margin-top:0.4rem;display:flex;gap:0.3rem;justify-content:flex-end;flex-wrap:wrap;">
          ${tagsHtml}
        </div>
      </div>
    </div>

    <!-- 4 Health Metric Highlights -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:0.8rem;margin-bottom:1.4rem;">
      <!-- Calories Taken vs Burned -->
      <div style="background:#FFFFFF;border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.8rem;">
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);">🥗 CALORIES TAKEN</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--dark);">${(n.consumedKcal || 0).toLocaleString()} kcal</div>
        <div style="font-size:0.75rem;color:var(--primary);font-weight:600;">Goal: ${calPct}% (Target: ${(n.targetKcal || 2100).toLocaleString()})</div>
      </div>

      <!-- Protein Intake -->
      <div style="background:#FFFFFF;border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.8rem;">
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);">🥩 PROTEIN CONSUMED</div>
        <div style="font-size:1.3rem;font-weight:800;color:var(--primary);">${n.protein || 0}g</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${proPct}% of ${n.proteinTarget || 150}g target</div>
      </div>

      <!-- Workout Burned -->
      <div style="background:#FFFFFF;border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.8rem;">
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);">🔥 WORKOUT BURN</div>
        <div style="font-size:1.3rem;font-weight:800;color:#EF4444;">${d.workout?.burnedKcal || 0} kcal</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${d.workout?.name || 'Workout'} (${d.workout?.duration || '40 min'})</div>
      </div>

      <!-- Steps & Sleep -->
      <div style="background:#FFFFFF;border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.8rem;">
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);">👟 STEPS & SLEEP</div>
        <div style="font-size:1.3rem;font-weight:800;color:#2563EB;">${(d.steps?.total || 0).toLocaleString()} steps</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">Sleep: ${d.sleep?.hours || 7.5} hrs (${d.sleep?.quality || 88}% Rest)</div>
      </div>
    </div>

    <!-- Detailed Nutrition Taken That Day: Itemized Meals -->
    <div style="background:#FFFFFF;border:1px solid var(--border);border-radius:var(--radius-md);padding:1.2rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem;border-bottom:1px solid var(--border-light);padding-bottom:0.5rem;">
        <div style="font-size:0.95rem;font-weight:800;color:var(--dark);">
          🥗 Nutrition Taken on ${d.displayDate}
        </div>
        <span class="badge badge-green">${meals.length} Meals Logged</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:0.7rem;">
        ${meals.length === 0 ? '<div style="font-size:0.82rem;color:var(--text-muted);font-style:italic;">No meals logged for this day.</div>' : meals.map(m => `
          <div style="background:var(--bg);padding:0.7rem 0.9rem;border-radius:var(--radius-sm);border:1px solid var(--border);">
            <div style="font-size:0.75rem;font-weight:700;color:var(--primary);text-transform:uppercase;">${m.type || 'Meal'} • ${m.time || 'Logged'}</div>
            <div style="font-size:0.95rem;font-weight:800;color:var(--dark);margin-top:0.15rem;">${m.name}</div>
            <div style="font-size:0.82rem;color:var(--text-muted);margin-top:0.2rem;">
              +${m.kcal} kcal • <strong style="color:var(--primary);">+${m.protein}g Protein</strong>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderArchiveTimelineCards(archive) {
  const container = document.getElementById("archive-timeline-cards-row");
  if (!container) return;

  let filtered = archive;
  if (currentArchiveFilter === "7days") {
    filtered = archive.slice(0, 7);
  } else if (currentArchiveFilter === "today") {
    filtered = archive.slice(0, 1);
  }

  container.innerHTML = filtered.map(d => {
    const isActive = (d.date === activeSelectedScenarioDate);
    return `
      <div class="archive-day-card ${isActive ? 'active' : ''}" onclick="selectArchiveDay('${d.date}')" title="Click to view full scenario for ${d.displayDate}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="day-date">${d.displayDate.split(",")[0]}</span>
          <span style="font-size:1.1rem;">${d.mood.split(" ")[1] || '😊'}</span>
        </div>
        <div style="font-size:0.75rem;font-weight:700;color:var(--primary);">
          ${(d.nutrition?.consumedKcal || 0).toLocaleString()} kcal
        </div>
        <div class="day-stat">🥩 ${d.nutrition?.protein || 0}g Pro</div>
        <div class="day-stat">👟 ${(d.steps?.total || 0).toLocaleString()} steps</div>
        <div class="day-stat">🌙 ${d.sleep?.hours || 7.5}h (${d.sleep?.quality || 88}%)</div>
      </div>
    `;
  }).join("");
}

function selectArchiveDay(dateStr) {
  activeSelectedScenarioDate = dateStr;
  const user = getUserData();
  const storageKey = getScenarioArchiveStorageKey(user);
  let archive = [];
  try {
    archive = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch (e) {}

  if (archive.length > 0) {
    renderArchiveUI(archive);
  }
}

function onArchiveDateSelectChange(dateStr) {
  selectArchiveDay(dateStr);
}

function filterArchiveDays(filterType) {
  currentArchiveFilter = filterType;
  const user = getUserData();
  const storageKey = getScenarioArchiveStorageKey(user);
  let archive = [];
  try {
    archive = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch (e) {}

  if (archive.length > 0) {
    renderArchiveTimelineCards(archive);
  }
}

function exportMonthlyScenarioReport() {
  const user = getUserData();
  const storageKey = getScenarioArchiveStorageKey(user);
  let archive = [];
  try {
    archive = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch (e) {}

  const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archive, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", jsonStr);
  downloadAnchor.setAttribute("download", `metaai_monthly_scenario_report_${user.name || 'user'}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast("Exported 30-Day Health Scenario Records report! 📥");
}
