# 🎨 Frontend Architecture & Implementation Guide

## Overview

The frontend is built with **React 18** and **Vite**, designed to be a high-performance, responsive, and visually stunning interface for the Claims Adjudication Engine. It focuses on providing immediate feedback to the user while handling complex asynchronous tasks in the background.

## 🛠️ Tech Stack

-   **Core**: React 18 (TypeScript)
-   **Build Tool**: Vite (Fast HMR and optimized builds)
-   **Styling**: Tailwind CSS (Utility-first)
-   **Animations**: Framer Motion (Enterprise-grade animations)
-   **Icons**: Lucide React
-   **State**: React Hooks (`useState`, `useEffect`)

## 📂 Key Components

### 1. `LandingPage.tsx`
The entry point of the application. It features:
-   **Gradient Mesh Hero**: A visually arresting background using CSS gradients and Framer Motion for subtle movement.
-   **Bento Grid Features**: A modern grid layout to showcase key platform capabilities.
-   **Floating Elements**: 3D-style floating cards that react to scroll position.

### 2. `Dashboard.tsx`
The core operational interface.
-   **File Upload**: Drag-and-drop zone with validation for file types (PDF, JPG, PNG).
-   **Real-time Polling**: Implements a polling mechanism to check claim status every 2 seconds after upload.
-   **Status Visualization**:
    -   **Progress Bar**: Visualizes the "Processing" state.
    -   **Badges**: Color-coded badges for `APPROVED`, `REJECTED`, or `MANUAL_REVIEW`.
-   **Result Display**: Shows extracted data (Patient Name, Hospital) alongside the adjudication decision and reasons.

### 3. `Card.tsx` & UI Components
Reusable, composable components following the "shadcn/ui" pattern.
-   **Glassmorphism**: Components use `backdrop-blur` and semi-transparent backgrounds to create depth.
-   **Responsive Design**: All components adapt seamlessly to mobile, tablet, and desktop screens.

## 🔄 State Management & Data Flow

1.  **Upload**: User selects a file -> `handleUpload` sends `POST /api/claims/upload`.
2.  **Processing**: App enters "Polling Mode". `pollStatus` calls `GET /api/claims/{id}` every 2s.
3.  **Completion**: When status changes from `PROCESSING` to a final state, polling stops, and results are rendered.

## 🎨 Design System

-   **Typography**:
    -   **Headings**: *Outfit* (Modern, geometric sans-serif)
    -   **Body**: *Inter* (Clean, highly readable)
-   **Color Palette**:
    -   **Primary**: Deep Indigo (`#4F46E5`)
    -   **Background**: Dark Slate (`#0F172A`)
    -   **Accents**: Cyan and Purple gradients.

## 🚀 Performance Optimizations

-   **Code Splitting**: Vite automatically splits chunks for optimal loading.
-   **Lazy Loading**: Heavy components are lazy-loaded.
-   **Optimized Assets**: Images and fonts are optimized for web delivery.
