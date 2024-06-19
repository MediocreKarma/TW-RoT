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

export const clearUserData = () => {
    localStorage.removeItem(UserData.id);
    localStorage.removeItem(UserData.username);
    localStorage.removeItem(UserData.flags);
};
