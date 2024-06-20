const UserData = {
    id: 'userId',
    username: 'userUsername',
    flags: 'userFlags',
};

export const userData = () => {
    const id = localStorage.getItem(UserData.id);
    const username = localStorage.getItem(UserData.username);
    const flags = localStorage.getItem(UserData.flags);

    return id && username && flags
        ? {
              id,
              username,
              flags,
          }
        : null;
};

export const isLoggedIn = () => {
    return userData() ? true : false;
    // if (userData() == null) {
    //     // make a quick request to /authenticated to check
    // }
    // return true
};

export const clearUserData = () => {
    localStorage.removeItem(UserData.id);
    localStorage.removeItem(UserData.username);
    localStorage.removeItem(UserData.flags);
};

export const setUserData = (user) => {
    localStorage.setItem(UserData.id, user.id);
    localStorage.setItem(UserData.username, user.username);
    localStorage.setItem(UserData.flags, user.flags);
};
