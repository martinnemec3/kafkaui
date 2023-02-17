import { BrowserWindow, ipcMain } from 'electron';
import { Configuration } from '../../types/types';
import configuration from '../configuration';

export const register = (mainWindow : BrowserWindow) => {
    ipcMain.handle('getConfiguration', () : Promise<Configuration> => {
    return Promise.resolve(configuration);
    });
}