# Timetable Viewer - 3rd Year CCE-B

A modern, responsive, and personalized timetable management application explicitly designed for **3rd Year Computer & Communication Engineering - Section B** (Semester VI, AY 2025-26) at **Manipal Institute of Technology**.

## 🚀 Features

- **Personalized View**: Select your specific electives (PE-1, PE-2, OE, and Flexi Core 2) and lab batches (B1/B2) to generate a timetable tailored exactly to your schedule.
- **Day & Week Modes**: Toggle between a focused daily view and a comprehensive weekly overview.
- **Real-time Tracking**: 
    - **Active Class**: Automatically highlights the current period based on system time.
    - **Progression**: Grays out past classes to help you focus on what's next.
- **Configuration Management**:
    - **Persistent Settings**: Your selections are saved locally and persist through browser refreshes.
    - **Export/Import**: Share your configuration with classmates or back it up for later use.
- **Modern Interface**: Built with a sleek, minimalist aesthetic using **Next.js**, **ShadCN**, and **Radix UI**.
- **Responsive Design**: Fully optimized for both desktop and mobile devices.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [ShadCN UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Phosphor Icons](https://phosphoricons.com/)
- **Runtime**: [Bun](https://bun.sh/)

## 🏃 Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed on your machine.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/aaditagrawal/semester-timetable-v1
    cd timetable-v1
    ```

2.  **Install dependencies**:
    ```bash
    bun install
    ```

3.  **Run the development server**:
    ```bash
    bun dev
    ```

4.  **Open the app**:
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components (Timetable tiles, Modals, Settings).
- `lib/`: Utility functions and the core `timetable-data.ts` definition.
- `public/`: Static assets and icons.

## 📝 Configuration

The timetable data is centrally managed in `lib/timetable-data.ts`. This includes:
- Course codes and names.
- Faculty assignments.
- Room numbers.
- Lab batch timings.

## 🤝 Contributing

This project is tailored for CCE-B. If you find any discrepancies in the schedule or have feature requests, feel free to open a PR or an issue!

---

*Made for MITians by MITians.*
