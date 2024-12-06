# MedScan AI

A modern web application that uses AI to analyze medical reports and provide detailed insights. Built with React, TypeScript, and Tailwind CSS.

## Features

- 🔍 AI-powered medical report analysis
- 📊 Detailed breakdown of test results
- 🎨 Modern, responsive UI with dark mode support
- 📱 Mobile-friendly design
- 🖼️ Support for PNG and JPEG image formats
- 📋 Formatted results with tables and highlights

## Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (comes with Node.js)

## Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/bytesizeddiva/MedScan-AI.git
cd medscan-ai
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your xAI API key:

```env
VITE_XAI_API_KEY=your-api-key-here
```

## Running the Application

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and navigate to:

```
http://localhost:5173
```

## Building for Production

1. Create a production build:

```bash
npm run build
```

2. Preview the production build:

```bash
npm run preview
```

## Project Structure

```
medscan-ai/
├── src/
│   ├── assets/         # Static assets
│   ├── components/     # React components
│   ├── services/       # API services
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── public/            # Public assets
└── index.html         # HTML entry point
```

## Technology Stack

- [React](https://reactjs.org/) - UI Framework
- [TypeScript](https://www.typescriptlang.org/) - Programming Language
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vite](https://vitejs.dev/) - Build Tool
- [x.ai API](https://x.ai/) - AI Image Analysis

## API Configuration

The application uses the x.ai API for medical report analysis. You'll need to:

1. Sign up for an API key at [x.ai](https://x.ai)
2. Add your API key to the `.env` file
3. Keep your API key secure and never commit it to version control

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
