# 🚦 Smart Traffic Control System

> A real-time adaptive traffic management simulation built with **React** and **Three.js** — featuring dynamic signal control, ambulance priority overrides, and live traffic monitoring across multiple intersections.

---

## 📸 Preview

![Traffic Simulation](./image.png)

---

## ✨ Features

### 🧠 Adaptive Signal Intelligence
- Scans all vehicles every second and groups them by **intersection** and **direction** (N/S/E/W)
- Calculates **queue length** and **wait time** per lane
- Assigns the green signal to the highest-scoring direction using:
  ```js
  const score = (queuedCars * 2) + waitTime;
  ```
- Signal lock duration scales dynamically with traffic density

### 🚑 Ambulance Priority Override
- Ambulances spawn dynamically within the simulation
- Instantly overrides normal traffic flow upon detection
- Forces a green signal in the ambulance's direction, bypassing timing locks if required

### ⛔ Collision & Spacing System
- Cars maintain a configurable minimum gap (`CAR_GAP`)
- Lane-based collision detection with smooth deceleration near stop lines and other vehicles

### 🚦 Dynamic Traffic Lights
- Fully programmatic signal control
- Three light states: 🔴 Red · 🟡 Yellow (transition) · 🟢 Green
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
  ├── CarOnModel        # Vehicle movement & collision logic
  ├── TrafficOnModel    # Spawns cars & ambulances
  ├── TrafficLight      # Controls signal states
  └── MainScene         # Core simulation orchestration
```

---

## 🔥 How It Works

1. Cars move continuously across lanes in the 3D scene
2. The system scans all vehicles **every second**
3. Vehicles are grouped by **intersection** and **direction**
4. For each group, **queue size** and **wait time** are calculated
5. A score is computed per direction — the highest scorer gets the green light
6. Signal lock duration scales with traffic density
7. If an ambulance is detected, the scoring system is **immediately overridden**

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

## 👥 Contributors

This project was built collaboratively as a group project.



## 📄 License

This project is open source. Feel free to fork, extend, and contribute.
