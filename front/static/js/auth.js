export const userData = () => {
    const id = localStorage.getItem('userId');
    const username = localStorage.getItem('userUsername');
    const flags = localStorage.getItem('userFlags');

    return id && username && flags
        ? {
              id,
              username,
              flags,
          }
        : null;
};
