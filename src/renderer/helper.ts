import { Api } from "../types/types";

export const getApi = (window : Window) : Api => {
    return (window as Window & { electronAPI: Api}).electronAPI;
}