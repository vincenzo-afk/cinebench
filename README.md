# CineBench — Your Ultimate Cinema Companion

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%23202328.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TMDB](https://img.shields.io/badge/TMDB-01b4e4?style=for-the-badge&logo=the-movie-database&logoColor=white)](https://www.themoviedb.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**CineBench** is a high-performance, feature-rich movie and TV show discovery platform built with modern web technologies. It provides a seamless interface for users to explore trending titles, manage their personal watchlists, and compare their favorite cinematic works with ease.

## 🚀 Key Features

CineBench is designed to be the central hub for your movie-watching experience, offering a suite of powerful tools for discovery and management:

*   **Intelligent Discovery:** Explore trending, popular, top-rated, and upcoming movies and TV shows powered by the The Movie Database (TMDB) API.
*   **Personalized Watchlist & Favourites:** Save titles for later or mark them as your all-time favorites with persistent local storage.
*   **Dynamic Comparison Engine:** Compare two movies or shows side-by-side, analyzing ratings, runtime, genres, and more to help you decide what to watch next.
*   **Interactive Genre Quiz:** Tailor your home feed with a quick genre preference quiz that personalizes your recommendations.
*   **Advanced Filtering:** Narrow down your search by genre, release year, rating, and popularity to find exactly what you're in the mood for.
*   **Import/Export Capability:** Take your library with you. Export your watchlist and favorites as JSON and import them back anytime.
*   **Library Statistics:** Get insights into your watching habits with a stats panel showing total watch time, average ratings, and collection counts.

## 🛠 Tech Stack

The application is built using a modern, lightweight, and performant stack:

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | Vanilla JavaScript / Vite |
| **Styling** | Custom CSS3 with CSS Variables |
| **Data Source** | [TMDB API](https://developer.themoviedb.org/docs/getting-started) |
| **State Management** | Native JavaScript Object State |
| **Storage** | Browser LocalStorage |
| **Icons** | Emoji & Custom SVG |

## 📦 Installation & Setup

To get a local copy up and running, follow these simple steps:

### Prerequisites

*   **Node.js** (v18.0.0 or higher)
*   **npm** or **pnpm**
*   **TMDB API Key** (Get one for free at [themoviedb.org](https://www.themoviedb.org/settings/api))

### Step-by-Step Guide

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/vincenzo-afk/cinebench.git
    cd cinebench
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add your TMDB API key:
    ```bash
    cp .env.example .env
    # Edit .env and replace 'your_api_key_here' with your actual key
    ```

4.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 🏗 Project Structure

```text
cinebench/
├── .github/          # GitHub workflows and templates
├── scripts/          # Utility and testing scripts
├── index.html        # Main entry point
├── app.js            # Core application logic
├── style.css         # Global styles and variables
├── package.json      # Dependencies and scripts
└── .env.example      # Environment template
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🌟 Acknowledgments

*   [The Movie Database (TMDB)](https://www.themoviedb.org/) for their incredible API.
*   [Vite](https://vitejs.dev/) for the lightning-fast build tool.
*   All the contributors who have helped improve this project.

---

Built with ❤️ by [vincenzo-afk](https://github.com/vincenzo-afk)
