export const renderLoading = (node) => {
    node.innerText = 'Se încarcă...';
};

export const renderMessage = (message) => {
    let messageContainer = document.createElement('div');
    let mainMessage = document.createElement('p');
    mainMessage.textContent = message;
    messageContainer.appendChild(mainMessage);
    return messageContainer;
};
