import { isLoggedIn } from './auth.js';

if (!isLoggedIn()) {
    window.location.href = '/';
}
