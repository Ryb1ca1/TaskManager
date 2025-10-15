export const getFromStorage = function (key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
};

export const addToStorage = function (obj, key) {
    const storageData = getFromStorage(key);
    storageData.push(obj);
    localStorage.setItem(key, JSON.stringify(storageData));
};

export const generateTestUser = function (User) {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.length === 0) {
        const testUser = new User("test", "qwerty123", "admin");
        User.save(testUser);
    }
};
