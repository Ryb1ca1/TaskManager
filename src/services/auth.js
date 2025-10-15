import { appState } from "../app";
import { User } from "../models/User";
import { getFromStorage } from "../utils";

export const authUser = function (login, password) {
    const users = getFromStorage("users");
    const foundUser = users.find(u => u.login === login && u.password === password);
    if (!foundUser) return null;
    const user = new User(foundUser.login, foundUser.password, foundUser.role);
    appState.currentUser = user;
    return user;
};
