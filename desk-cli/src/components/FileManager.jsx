import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { ProfileContext } from '../contexts/Context.jsx';
import { fetchFiles, deleteFile, uploadFile, downloadFile, previewFile } from '../services/fileService.js';
import '../css/file-manager.css'

export default function FileManager() {
  const { user, logout } = useContext(ProfileContext);
  const token = localStorage.getItem('token');

  const [files, setFiles] = useState([]);
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [preview, setPreview] = useState(null);
  
  const [columns, setColumns] = useState({
    createdAt: true,
    updatedAt: true,
    uploader: true,
    editor: true,
  });

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const data = await fetchFiles(token);
      setFiles(data);
    } catch (err) {
      console.error(err);
      if (err.message === "Session expired") {
        alert("Session expired. Please log in again.");
        logout();
      }
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await deleteFile(id, token);
      setFiles(files.filter(f => f.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Could not delete file');
    }
  };

  const handleDownload = async (e, id, filename) => {
    e.stopPropagation();
    
    try {
      const blob = await downloadFile(id, token);

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      
      document.body.appendChild(a); 
      a.click();
      a.remove(); 
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not download file');
    }
  };

  const handleUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList.length) return;

    let failed = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const formData = new FormData();

      formData.append('file', file);

      const existingFile = files.find(
        (f) => `${f.title}${f.extension}` === file.name
      );

      const method = existingFile ? 'PUT' : 'POST';

      try {
        await uploadFile(method, formData, token);
      } catch (err) {
        console.error(`Network error on ${file.name}:`, err);
        failed++;
      }
    }

    if (failed > 0) {
      alert(`Finished with ${failed} error(s). Check console for details.`);
    }

    await loadFiles(token); 

    e.target.value = '';
  };

  
  const handlePreview = async (file) => {
    try {
      if (file.extension === '.png') {
        const blob = await previewFile(file.id, token, 'blob');
        const imageUrl = window.URL.createObjectURL(blob);
        
        setPreview({ type: 'image', url: imageUrl, name: file.title });
        
      } else if (file.extension === '.java') {
        const text = await previewFile(file.id, token, 'text');
        
        setPreview({ type: 'code', content: text, name: file.title });
        
      } else {
        alert(`Preview not supported for ${file.extension}`);
      }
    } catch (err) {
      console.error('Preview error:', err);
      alert('Could not load file preview');
    }
  };

  const handleTwoWaySync = async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (!folderPath) return;

    const localFiles = await window.electronAPI.scanLocalFolder(folderPath);
    const localMap = new Map(localFiles.map(f => [f.name, f]));

    const serverMap = new Map(
      files.map(f => [`${f.title}${f.extension}`, f])
    );

    let uploaded = 0;
    let downloaded = 0;
    let skipped = 0;

    for (const [serverFilename, serverFile] of serverMap.entries()) {
      const localFile = localMap.get(serverFilename);

      if (!localFile) {
        try {
          const fileBlob = await downloadFile(serverFile.id, token);

          const arrayBuffer = await fileBlob.arrayBuffer();
          await window.electronAPI.writeLocalFile(folderPath, serverFilename, arrayBuffer);
          
          downloaded++;
        } catch (err) {
          console.error(`Failed to download ${serverFilename}:`, err);
        }
      }
    }

    for (const [localFilename, localFile] of localMap.entries()) {
      const serverFile = serverMap.get(localFilename);

      const serverHash = serverFile?.sha256 ? 
        (typeof serverFile.sha256 === 'string' 
          ? serverFile.sha256 
          : Object.values(serverFile.sha256.data || serverFile.sha256)
              .map(b => b.toString(16).padStart(2, '0')).join(''))
        : null;

      const method = serverFile ? 'PUT' : 'POST';
      if (method == 'PUT' && serverHash == localFile.sha256) {
        skipped++;
        continue;
      }

      try {
        const arrayBuffer = await window.electronAPI.readLocalFile(localFile.path);
        const fileData = new Blob([arrayBuffer]);
        
        const formData = new FormData();
        formData.append('file', fileData, localFilename);

        await uploadFile(method, formData, token);
        uploaded++;
      } catch (err) {
        console.error(`Failed to upload ${localFilename}:`, err);
      }
    }

    alert(`Sync complete: ${uploaded} uploaded, ${downloaded} downloaded, ${skipped} up to date.`);
    await loadFiles();
  };


  const processedFiles = files
    .filter(f => filter === 'all' ? true : f.extension === filter)
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="file-manager">
      <div className="header-container">
        <h2>Mockdrive</h2>
        <button onClick={logout} className="btn logout-btn">Logout</button>
      </div>

      {/* upload part */}
      <div className="toolbar">
        <div>
          <label className="btn">
            Upload File
            <input type="file" hidden multiple onChange={handleUpload} />
          </label>
        </div>
        
        {/* sync part */}
        <div>
          <button className="btn" onClick={handleTwoWaySync}>
            Sync Folder
          </button>
        </div>

      {/* sort part */}
      <div>
        <button onClick={() => setSortAsc(!sortAsc)} className="sort-btn">
          Sort by Modified: {sortAsc ? 'Ascending ↑' : 'Descending ↓'}
        </button>
      </div>

      {/* filter part */}
      <div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
          <option value="all">Show All Files</option>
          <option value=".kt">.kt only</option>
          <option value=".jpg">.jpg only</option>
        </select>
      </div>
    </div>

      {/* toggle part */}
    <div className="column-toggles">
      <strong>Toggle Columns: </strong>
      {Object.keys(columns).map(col => (
        <label key={col} className="toggle-label">
          <input 
            type="checkbox" 
            checked={columns[col]} 
            onChange={() => setColumns(prev => ({ ...prev, [col]: !prev[col] }))} 
          /> 
          {col}
        </label>
      ))}
    </div>

        {/* table part */}
      <table className="file-table">
        <thead>
          <tr>
            <th>Name</th>
            {columns.createdAt && <th>Created At</th>}
            {columns.updatedAt && <th>Modified At</th>}
            {columns.uploader && <th>Uploader</th>}
            {columns.editor && <th>Editor</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {processedFiles.map(file => (
            <tr 
              key={file.id} 
              onClick={() => handlePreview(file)}
              className="file-row"
              title="Click to preview if supported"
            >
              <td>{file.title}{file.extension}</td>
              {columns.createdAt && <td>{new Date(file.createdAt).toLocaleString()}</td>}
              {columns.updatedAt && <td>{new Date(file.updatedAt).toLocaleString()}</td>}
              {columns.uploader && <td>{file.uploader?.email || '—'}</td>}
              {columns.editor && <td>{file.editor?.email || '—'}</td>}
              <td className="actions-cell">
                <button 
                  className="download-btn" 
                  onClick={(e) => handleDownload(e, file.id, `${file.title}${file.extension}`)}
                >
                  Download
                </button>
                <button 
                  className="delete-btn" 
                  onClick={(e) => handleDelete(e, file.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {processedFiles.length === 0 && (
            <tr>
              <td colSpan="6" className="empty-message">No files found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* preview part */}
      {preview && (
        <div className="preview-overlay">
          <div className="preview-header">
            <h3>Preview: {preview.name}</h3>
            <button className="preview-close-btn" onClick={() => {
              if (preview.url) URL.revokeObjectURL(preview.url); 
              setPreview(null);
            }}>Close</button>
          </div>
          
          <div className="preview-content">
            {preview.type === 'image' && <img src={preview.url} alt="preview" className="preview-image" />}
            {preview.type === 'code' && <pre><code>{preview.content}</code></pre>}
          </div>
        </div>
      )}
    </div>
  );
}