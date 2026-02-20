import axios from 'axios';

const api = axios.create({
  baseURL: '/api/',
  withCredentials: true,
  // Axios will read the CSRF cookie and set the header automatically for unsafe methods.
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

export default api;
