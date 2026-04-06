# 🚦 Smart Traffic Control System (3D Simulation)

## 📸 Preview

### 🧠 Intelligent Traffic Flow
![Traffic Simulation](./assets/traffic-view.png)

### 📊 Live System Overlay
![Dashboard Overlay](./assets/dashboard-view.png)

---

## ⚡ What This Project Does

This is a **real-time adaptive traffic control simulation** built using **Three.js + React Three Fiber**.

Unlike basic timer-based systems, this simulation:

- Tracks vehicle movement dynamically  
- Detects congestion per direction (N/S/E/W)  
- Adjusts traffic signals based on real-time conditions  
- Handles **ambulance priority overrides**  
- Prevents collisions with spacing logic  
- Simulates continuous urban traffic  

---

## 🧠 Core Features

### 🚗 Smart Traffic Logic
- Each intersection calculates:
  - Queue length
  - Wait time  
- Decision formula:

```js
score = (cars * 2) + wait_time

# 🚦 Smart Traffic Simulation System

An intelligent, real-time traffic management simulation built with React and Three.js — featuring dynamic signal control, ambulance priority overrides, and live traffic monitoring across multiple intersections.

---

## ✨ Features

### 🚑 Emergency Handling (Ambulance Priority)
- Ambulances spawn dynamically within the simulation
- System instantly overrides normal traffic flow upon detection
- Forces a green signal in the ambulance's direction
- Can bypass timing locks if required

### ⛔ Collision & Spacing System
- Cars maintain a configurable minimum gap (`CAR_GAP`)
- Lane-based collision detection
- Smooth deceleration near stop lines and other vehicles

### 🚦 Dynamic Traffic Lights
- Fully programmatic signal control
- Supports three light states: 🔴 Red · 🟡 Yellow (transition) · 🟢 Green
- Includes realistic transition delays

### 🌍 Multi-Intersection Support
- Currently supports intersections `I1` and `I2`
- Easily extendable for larger road networks

### 📊 Live Monitoring Overlay
- Queue count per direction
- Active green signal indicator
- Remaining signal time display

---

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| React | UI & component architecture |
| React Three Fiber | React renderer for Three.js |
| Three.js | 3D scene & rendering |
| GLTF Models | Road & vehicle assets |
| Custom Global State | Simulation-wide state management |

---

## 📁 Project Structure

```
/components
  ├── CarOnModel        # Handles vehicle movement & collision
  ├── TrafficOnModel    # Spawns cars & ambulances
  ├── TrafficLight      # Controls signal states
  └── MainScene         # Core simulation logic
```

---

## 🔥 How It Works

1. Cars move continuously across lanes in the simulation
2. The system scans all vehicles every second
3. Vehicles are grouped by **intersection** and **direction**
4. For each group, the system calculates **queue size** and **wait time**
5. A score is computed per direction and the green signal is assigned to the highest scorer
6. Signal lock duration scales with traffic density
7. If an ambulance is detected, the scoring system is immediately overridden

---

## 🧪 Core Scoring Logic

```js
const score = counts[id][app] * 2 + waitTime.current[id][app];
```

The score weighs both the number of queued vehicles and how long they've been waiting, ensuring a fair and responsive signal allocation.

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

### 3. Open in your browser

```
http://localhost:3000
```

---

## 📄 License

This project is open source. Feel free to fork, extend, and contribute.
