import React, { useState } from 'react';
import { Download, Loader2, FolderDown, X } from 'lucide-react';
import { exportAsViteProject } from '../../lib/exportProject';

export default function ExportButton({ code, disabled }) {
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('my-ui-component');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAsViteProject(code, projectName || 'ui-as-code-export');
      setShowModal(false);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        title="Export as Vite project"
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FolderDown className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Export Project</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="my-ui-component"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-medium text-gray-700 mb-2">Your zip will include:</p>
                {[
                  ['vite.config.js', 'Vite + Tailwind CSS v4 setup'],
                  ['src/App.jsx', 'Your generated component'],
                  ['src/index.css', 'Tailwind v4 import'],
                  ['package.json', 'React 18 + Lucide React'],
                  ['README.md', 'Getting started guide'],
                ].map(([file, desc]) => (
                  <div key={file} className="flex items-center gap-3">
                    <span className="font-mono text-xs bg-white border border-gray-200 text-purple-600 px-2 py-0.5 rounded-md">{file}</span>
                    <span className="text-xs text-gray-500">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting || !projectName}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting ? 'Exporting...' : 'Download .zip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
