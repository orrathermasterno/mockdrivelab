export interface IElectronAPI {
  selectFolder: () => Promise<string | null>;
  scanLocalFolder: (folderPath: string) => Promise<Array<{
    name: string;
    path: string;
    size: number;
    mtime: number;
    sha256: string;
  }>>;
  writeLocalFile: (folderPath: string, filename: string, buffer: ArrayBuffer) => Promise<boolean>;
  readLocalFile: (filePath: string) => Promise<ArrayBuffer>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}