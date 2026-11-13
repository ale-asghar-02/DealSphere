// Access token sirf memory mein rakha jata hai — localStorage mein NAHI,
// taake XSS attack se chura na ja sake. Page reload hone par memory clear
// ho jati hai, isliye reload par refresh-token cookie se dobara mangwana hoga.

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};