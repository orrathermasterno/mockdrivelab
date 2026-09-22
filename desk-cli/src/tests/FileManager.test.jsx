import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ProfileContext } from '../contexts/Context.jsx';
import FileManager from '../components/FileManager.jsx';
import * as api from '../services/fileService.js'; 
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('../services/fileService.js', () => ({
  fetchFiles: vi.fn(),
  downloadFile: vi.fn(),
  uploadFile: vi.fn(),
  deleteFile: vi.fn()
}));

window.electronAPI = {
  selectFolder: vi.fn(),
  scanLocalFolder: vi.fn()
};

describe('FileManager Sorting', () => {
  afterEach(() => {
    cleanup();
  });
  const mockFiles = [
    {
      id: 1,
      title: 'OldFile',
      extension: '.txt',
      updatedAt: '2026-01-01T10:00:00Z', 
    },
    {
      id: 2,
      title: 'NewFile',
      extension: '.txt',
      updatedAt: '2026-12-01T10:00:00Z', 
    }
  ];

  it('toggles file order between ascending and descending dates', async () => {
    api.fetchFiles.mockResolvedValue(mockFiles);

    render(
      <ProfileContext.Provider value={{ user: { email: 'test@test.com' }, logout: vi.fn() }}>
        <FileManager />
      </ProfileContext.Provider>
    );

    await waitFor(() => {
      expect(document.querySelectorAll('.file-row')).toHaveLength(2);
    });

    let rows = document.querySelectorAll('.file-row');

    expect(rows[0].textContent).toContain('OldFile');
    expect(rows[1].textContent).toContain('NewFile');

    const sortBtn = screen.getByText(/Sort by Modified/i);
    fireEvent.click(sortBtn);

    rows = document.querySelectorAll('.file-row');

    expect(rows[0].textContent).toContain('NewFile');
    expect(rows[1].textContent).toContain('OldFile');
    
    expect(sortBtn.textContent).toContain('Descending');
  });

  it('filters files by extension', async () => {
    const filterMockFiles = [
      { id: 1, title: 'Notes', extension: '.txt', updatedAt: '2026-01-01T10:00:00Z' },
      { id: 2, title: 'Photo', extension: '.jpg', updatedAt: '2026-01-02T10:00:00Z' },
      { id: 3, title: 'App', extension: '.kt', updatedAt: '2026-01-03T10:00:00Z' }
    ];
    
    api.fetchFiles.mockResolvedValue(filterMockFiles);

    render(
      <ProfileContext.Provider value={{ user: { email: 'test@test.com' }, logout: vi.fn() }}>
        <FileManager />
      </ProfileContext.Provider>
    );

    await waitFor(() => {
      expect(document.querySelectorAll('.file-row')).toHaveLength(3);
    });

    const filterSelect = document.querySelector('.filter-select');

    fireEvent.change(filterSelect, { target: { value: '.kt' } });

    await waitFor(() => {
      expect(document.querySelectorAll('.file-row')).toHaveLength(1);
    });
    
    let rows = document.querySelectorAll('.file-row');
    expect(rows[0].textContent).toContain('App.kt'); 

    fireEvent.change(filterSelect, { target: { value: '.jpg' } });

    await waitFor(() => {
      expect(document.querySelectorAll('.file-row')).toHaveLength(1);
    });
    
    rows = document.querySelectorAll('.file-row');
    expect(rows[0].textContent).toContain('Photo.jpg'); // Verify it swapped correctly

    fireEvent.change(filterSelect, { target: { value: 'all' } });

    await waitFor(() => {
      expect(document.querySelectorAll('.file-row')).toHaveLength(3);
    });
  });

  it('skips uploading when local and server file hashes match', async () => {
    const mockServerFiles = [
      {
        id: 1,
        title: 'MatchingHash',
        extension: '.txt',
        sha256: { 0: 17, 1: 85 },
        updatedAt: '2026-09-19T10:00:00Z'
      }
    ];
    api.fetchFiles.mockResolvedValue(mockServerFiles);

    window.electronAPI.selectFolder.mockResolvedValue('/fake/folder');
    window.electronAPI.scanLocalFolder.mockResolvedValue([
      {
        name: 'MatchingHash.txt',
        path: '/fake/folder/MatchingHash.txt',
        sha256: '1155' 
      }
    ]);

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <ProfileContext.Provider value={{ user: { email: 'test@test.com' }, logout: vi.fn() }}>
        <FileManager />
      </ProfileContext.Provider>
    );

    await waitFor(() => {
      expect(document.querySelectorAll('.file-row')).toHaveLength(1);
    });

    const syncBtn = screen.getByText(/Sync Folder/i);
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
    });

    expect(api.uploadFile).not.toHaveBeenCalled();
    expect(api.downloadFile).not.toHaveBeenCalled();
    
    expect(alertMock.mock.calls[0][0]).toContain('0 uploaded, 0 downloaded, 1 up to date');

    alertMock.mockRestore();
  });
});