import API from '/js/api.js';
import { get } from '/js/requests.js';

export const getRSSLink = () => {
    return `${API.USERS}/leaderboard?output=rss`;
};

export const getLeaderboardUsers = async (start, count) => {
    const response = await get(
        `${API.USERS}/leaderboard?start=${start}&count=${count}`
    );
    return await response.json();
};
