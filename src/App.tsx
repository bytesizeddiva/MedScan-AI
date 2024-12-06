import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { DocumentArrowUpIcon, SunIcon, MoonIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { analyzeImage } from './services/xaiService'

function App() {
  const [files, setFiles] = useState<File[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analyses, setAnalyses] = useState<{[key: string]: string}>({})
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check system preference on mount
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles])
      setError(null)
    }
  })

  const removeFile = (fileToRemove: File) => {
    setFiles(files.filter(f => f !== fileToRemove))
    setAnalyses(prev => {
      const newAnalyses = { ...prev }
      delete newAnalyses[fileToRemove.name]
      return newAnalyses
    })
  }

  const handleAnalyze = async () => {
    if (files.length === 0) return

    setAnalyzing(true)
    setError(null)

    try {
      const newAnalyses: {[key: string]: string} = {}
      for (const file of files) {
        if (!analyses[file.name]) {
          const result = await analyzeImage(file)
          newAnalyses[file.name] = result
        }
      }
      setAnalyses(prev => ({ ...prev, ...newAnalyses }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis')
    } finally {
      setAnalyzing(false)
    }
  }

  const cleanMarkdown = (text: string) => {
    return text.replace(/\*\*/g, '').replace(/\*/g, '');
  }

  const formatAnalysis = (text: string) => {
    const lines = text.split('\n')
    const formattedLines: JSX.Element[] = []
    let inTable = false
    let tableHeaders: string[] = []
    let tableRows: string[][] = []

    lines.forEach((line, index) => {
      // Handle table rows
      if (line.includes('|')) {
        if (!inTable) {
          inTable = true
          tableHeaders = line
            .split('|')
            .map(cell => cleanMarkdown(cell.trim()))
            .filter(cell => cell)
        } else if (line.includes('---')) {
          // Skip separator line
          return
        } else {
          const row = line
            .split('|')
            .map(cell => cleanMarkdown(cell.trim()))
            .filter(cell => cell)
          if (row.length) tableRows.push(row)
        }

        // If this is the last line or next line doesn't contain |, render the table
        if (!lines[index + 1]?.includes('|') && inTable) {
          formattedLines.push(
            <div key={`table-${index}`} className="my-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {tableHeaders.map((header, i) => (
                      <th
                        key={i}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b dark:border-gray-700"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {tableRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 
                      ? 'bg-white dark:bg-gray-900' 
                      : 'bg-gray-50 dark:bg-gray-800'}>
                      {row.map((cell, cellIndex) => {
                        const isOutOfRange = 
                          (tableHeaders[cellIndex]?.toLowerCase().includes('result') ||
                           tableHeaders[cellIndex]?.toLowerCase().includes('value')) &&
                          tableRows[rowIndex][cellIndex + 1] && // There's a reference range
                          !cell.toLowerCase().includes('normal') && // Not explicitly marked as normal
                          !cell.toLowerCase().includes('n/a'); // Not N/A

                        return (
                          <td
                            key={cellIndex}
                            className={`px-6 py-4 text-sm border-r last:border-r-0 dark:border-gray-700 ${
                              isOutOfRange 
                                ? 'text-red-600 dark:text-red-400 font-medium' 
                                : cell.toLowerCase().includes('normal') 
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-900 dark:text-gray-300'
                            }`}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          inTable = false
          tableHeaders = []
          tableRows = []
          return
        }
        return
      }

      // Handle regular text formatting
      let element: JSX.Element | null = null

      if (line.toLowerCase().includes('laboratory report analysis')) {
        element = <h1 key={index} className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">{cleanMarkdown(line)}</h1>
      } else if (line.toLowerCase().includes('patient information') || line.toLowerCase().includes('complete blood count') || line.toLowerCase().includes('key findings')) {
        element = <h2 key={index} className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-8 mb-4">{cleanMarkdown(line)}</h2>
      } else if (line.startsWith('- ')) {
        // Handle patient information fields
        const [key, value] = line.substring(2).split(':')
        if (value) {
          element = (
            <div key={index} className="flex items-start mb-3">
              <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[200px]">
                {cleanMarkdown(key)}:
              </span>
              <span className={`ml-2 ${
                value.toLowerCase().includes('high') || value.toLowerCase().includes('low')
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : value.toLowerCase().includes('normal')
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-900 dark:text-gray-100'
              }`}>
                {cleanMarkdown(value)}
              </span>
            </div>
          )
        }
      } else if (line.trim() && !line.startsWith('#')) {
        // Handle findings and other text
        if (line.includes(':')) {
          const [key, value] = line.split(':')
          element = (
            <div key={index} className="flex items-start mb-3">
              <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[200px]">
                {cleanMarkdown(key)}:
              </span>
              <span className={`ml-2 ${
                value.toLowerCase().includes('high') || value.toLowerCase().includes('low')
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : value.toLowerCase().includes('normal')
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-900 dark:text-gray-100'
              }`}>
                {cleanMarkdown(value)}
              </span>
            </div>
          )
        } else {
          element = <p key={index} className="text-gray-700 dark:text-gray-300 my-2">{cleanMarkdown(line)}</p>
        }
      }

      if (element) {
        formattedLines.push(element)
      }
    })

    return formattedLines
  }

  const goHome = () => {
    setFiles([]);
    setAnalyses({});
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-['Inter'] flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-[#eaeaea] dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <div 
              onClick={goHome}
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img src="/logo.svg" alt="MedScan AI Logo" className="w-8 h-8" />
              <span className="font-semibold text-black dark:text-white">MedScan AI</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-6 mt-16">
        <div className="max-w-screen-md w-full py-8">
          {!analyzing && Object.keys(analyses).length === 0 && (
            <div className="text-center mb-12">
              <h1 className="text-4xl font-medium tracking-tight text-black dark:text-white mb-4">
                Medical Report Analysis
              </h1>
              <p className="text-[#666666] dark:text-gray-400">
                Upload your medical reports for instant AI-powered analysis
              </p>
            </div>
          )}

          {!analyzing && Object.keys(analyses).length === 0 && (
            <div className="border border-[#eaeaea] dark:border-gray-800 rounded-lg p-6 dark:bg-gray-800/50">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-12
                  flex flex-col items-center justify-center
                  ${isDragActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                    : 'border-[#eaeaea] dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                  }
                  transition-all duration-200 cursor-pointer
                `}
              >
                <input {...getInputProps()} />
                <DocumentArrowUpIcon className={`w-8 h-8 mb-4 ${
                  isDragActive ? 'text-blue-500' : 'text-[#666666] dark:text-gray-400 group-hover:text-blue-500'
                }`} />
                <p className="text-sm text-[#666666] dark:text-gray-400 mb-1">
                  Drag & drop your files here, or{' '}
                  <span className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">browse</span>
                </p>
                <p className="text-xs text-[#999999] dark:text-gray-500">
                  Supports multiple medical images (PNG, JPG) up to 10MB each
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-6 space-y-4">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between border border-[#eaeaea] dark:border-gray-800 rounded-lg p-4 dark:bg-gray-800/50">
                      <div className="flex items-center min-w-0">
                        <DocumentArrowUpIcon className="w-5 h-5 text-[#666666] dark:text-gray-400 flex-shrink-0" />
                        <div className="ml-3 min-w-0">
                          <p className="text-sm font-medium text-black dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-[#666666] dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => removeFile(file)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                          <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing || files.length === 0}
                      className={`
                        px-4 py-2 text-sm rounded-md
                        ${analyzing || files.length === 0
                          ? 'bg-[#fafafa] dark:bg-gray-800 text-[#999999] dark:text-gray-500 cursor-not-allowed'
                          : 'bg-black dark:bg-white text-white dark:text-black hover:bg-[#333333] dark:hover:bg-gray-100'
                        }
                        transition-colors
                      `}
                    >
                      {analyzing ? 'Analyzing...' : 'Analyze All'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-8 p-4 border border-[#f4c7c7] dark:border-red-900/50 rounded-lg bg-[#fff0f0] dark:bg-red-900/20">
              <p className="text-sm text-[#ff0000] dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Analysis Results */}
          {analyzing && (
            <div className="text-center">
              <div className="inline-flex flex-col items-center">
                <div className="w-5 h-5 border-2 border-[#eaeaea] dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin mb-4"></div>
                <p className="text-sm bg-shimmer-gradient dark:bg-gradient-to-r dark:from-gray-700 dark:via-gray-500 dark:to-gray-700 bg-shimmer animate-shimmer text-transparent bg-clip-text">
                  Analyzing your reports...
                </p>
              </div>
            </div>
          )}

          {Object.keys(analyses).length > 0 && !analyzing && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <button
                  onClick={goHome}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                    border border-[#eaeaea] dark:border-gray-700 hover:border-[#000] dark:hover:border-gray-500
                    text-[#666666] dark:text-gray-400 hover:text-black dark:hover:text-white
                    bg-white dark:bg-gray-800 hover:bg-[#fafafa] dark:hover:bg-gray-700
                    transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back
                </button>
              </div>

              {Object.entries(analyses).map(([filename, analysis], index) => (
                <div key={index} className="border border-[#eaeaea] dark:border-gray-700 rounded-lg dark:bg-gray-800/50">
                  <div className="border-b border-[#eaeaea] dark:border-gray-700 p-6">
                    <h2 className="text-lg font-medium text-black dark:text-white">
                      Analysis Results - {filename}
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="prose max-w-none dark:prose-invert">
                      {formatAnalysis(analysis)}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end">
                <button
                  onClick={goHome}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
                    border border-[#eaeaea] dark:border-gray-700 hover:border-[#000] dark:hover:border-gray-500
                    text-[#666666] dark:text-gray-400 hover:text-black dark:hover:text-white
                    bg-white dark:bg-gray-800 hover:bg-[#fafafa] dark:hover:bg-gray-700
                    transition-all duration-200"
                >
                  <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                  Analyze new reports
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#eaeaea] dark:border-gray-800 py-6 mt-auto bg-white dark:bg-gray-900">
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <p className="text-sm text-[#666666] dark:text-gray-400">
            Powered by AI • Analyze medical reports with confidence
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
