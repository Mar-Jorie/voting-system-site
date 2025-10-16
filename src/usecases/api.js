// api.js

const API_BASE = "https://api.innque.com/v1";
const APP_ID = import.meta.env.VITE_APP_ID || "votes";
const MASTER_KEY = import.meta.env.VITE_MASTER_KEY || "cbd9e198-8f76-4d8f-93b1-04201de94e5d";
const DEFAULT_RETRIES = 3; // Number of retry attempts

// —————— Native Cookie Helpers ——————
function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `expires=${expires}`,
    `path=/`,
    `Secure`, // send only over HTTPS
    `SameSite=Strict`, // adjust: Lax or None as needed
  ].join("; ");
}
function getCookie(name) {
  return document.cookie.split("; ").reduce((value, pair) => {
    const [key, val] = pair.split("=");
    return decodeURIComponent(key) === name ? decodeURIComponent(val) : value;
  }, null);
}
function deleteCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// —————— JWT Helpers ——————
function saveToken(token) {
  setCookie("jwt", token); // defaults to 365 days
}
function getToken() {
  return getCookie("jwt");
}
function clearToken() {
  deleteCookie("jwt");
}

// —————— Utility: Delay for backoff ——————
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// —————— Core Fetch Wrapper with Retry ——————
async function request(path, { method = "GET", body = null, headers: customHeaders, retries = DEFAULT_RETRIES, timeout = 30000, signal } = {}) {
  const url = `${API_BASE}${path}`;
  
  // Recursive dispatch function
  async function dispatch(attempt) {
    const headers = new Headers(customHeaders);
    
    // Only set default Content-Type if not already set and body is not a Blob
    if (!headers.has("Content-Type") && !(body instanceof Blob)) {
      headers.set("Content-Type", "application/json");
    }
    
    const token = getToken();
    
    // Authentication logic: Always use master key for API requests
    // The Innque API uses master key authentication, not JWT tokens
    headers.set("X-Application-Id", APP_ID);
    if (MASTER_KEY) {
      headers.set("X-Master-Key", MASTER_KEY);
    }
    
    const opts = { method, headers };
    if (body != null) {
      // Only stringify if it's not already a string or Blob
      opts.body = body instanceof Blob || typeof body === "string" ? body : JSON.stringify(body);
    }
    if (signal) {
      opts.signal = signal;
    }
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
      });
      
      // Create fetch promise
      const fetchPromise = fetch(url, opts);
      
      // Race between fetch and timeout
      const res = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Retry on 5xx
      if (res.status >= 500 && attempt < retries) {
        const backoff = Math.pow(2, attempt) * 200 + Math.random() * 100;
        await delay(backoff);
        return dispatch(attempt + 1);
      }
      
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        if (errBody.message === "Invalid session token") {
          clearToken();
        }
        throw new Error(errBody.message || `${res.status} ${res.statusText}`);
      }
      
      return res.status === 204 ? null : res.json();
    } catch (err) {
      // Retry on timeout or network errors
      if ((err instanceof TypeError || /network/i.test(err.message) || /timeout/i.test(err.message)) && attempt < retries) {
        const backoff = Math.pow(2, attempt) * 200 + Math.random() * 100;
        await delay(backoff);
        return dispatch(attempt + 1);
      }
      throw err;
    }
  }
  
  return dispatch(0);
}

// —————— API Client Class ——————
class APIClient {
  constructor() {
    this.baseURL = API_BASE;
    this.appId = APP_ID;
  }

  // Generic request method with error handling
  async request(endpoint, options = {}) {
    return request(endpoint, options);
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Collections API methods
  async findObjects(collection, where = {}, options = {}) {
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (where && Object.keys(where).length > 0) {
      queryParams.set('where', JSON.stringify(where));
    }
    if (options.limit) {
      queryParams.set('limit', options.limit);
    }
    if (options.skip) {
      queryParams.set('skip', options.skip);
    }
    if (options.sort) {
      queryParams.set('sort', JSON.stringify(options.sort));
    }
    
    const queryString = queryParams.toString();
    const path = queryString ? `/collections/${collection}?${queryString}` : `/collections/${collection}`;
    
    
    const result = await this.request(path, { method: 'GET' });
    
    return result;
  }

  async getObject(collection, objectId) {
    return this.get(`/collections/${collection}/${objectId}`);
  }

  async createObject(collection, data) {
    return this.post(`/collections/${collection}`, data);
  }

  async updateObject(collection, objectId, data) {
    return this.put(`/collections/${collection}/${objectId}`, data);
  }

  async deleteObject(collection, objectId) {
    return this.delete(`/collections/${collection}/${objectId}`);
  }

  async countObjects(collection, where = {}) {
    const params = { where: JSON.stringify(where), count: true };
    return this.get(`/collections/${collection}`, params);
  }

  // JWT token management methods
  saveToken(token) {
    saveToken(token);
  }

  getToken() {
    return getToken();
  }

  clearToken() {
    clearToken();
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Export both the client and individual functions for flexibility
export default apiClient;
export { saveToken, getToken, clearToken };

// —————— Collections API (Individual Functions) ——————
export const createObject = (collection, data, options) => {
  if (!collection) throw new Error("Collection name is required");
  if (!data || typeof data !== "object") throw new Error("Data must be an object");
  return request(`/collections/${collection}`, { method: "POST", body: data, ...options });
};

export const findObjects = (collection, { where, limit, skip, sort, includes, keys } = {}, options) => {
  const qp = new URLSearchParams();
  if (where) qp.set("where", JSON.stringify(where));
  if (limit) qp.set("limit", limit);
  if (skip) qp.set("skip", skip);
  if (sort) qp.set("sort", JSON.stringify(sort));
  if (includes) qp.set("includes", JSON.stringify(includes));
  if (keys) qp.set("keys", JSON.stringify(keys));
  return request(`/collections/${collection}?${qp.toString()}`, options);
};

export const getObject = (collection, id, options) => request(`/collections/${collection}/${id}`, options);

export const updateObject = (collection, objectId, data, options) => request(`/collections/${collection}/${objectId}`, { method: "PUT", body: data, ...options });

export const deleteObject = (collection, id, options) => request(`/collections/${collection}/${id}`, { method: "DELETE", ...options });

export const countObjects = (collection, where) => {
  const qp = where ? `?where=${encodeURIComponent(JSON.stringify(where))}` : "";
  return request(`/count/${collection}${qp}`);
};

// —————— Users API ——————
export async function signUp({ email, password, firstName, lastName, username }) {
  // Hash password with MD5 before sending to database
  const { MD5 } = await import('crypto-js');
  const hashedPassword = MD5(password).toString();
  
  // Create user in database using Collections API
  const newUser = await createObject('users', {
    email: email,
    username: username,
    password: hashedPassword, // MD5 hashed
    firstName: firstName,
    lastName: lastName,
    status: 'active'
    });
  
  if (newUser.token) saveToken(newUser.token);
  return newUser;
}

// —————— Complete Login & Session Implementation ——————
export async function signIn({ email, password }) {
  // Clear any existing user data before signin
  localStorage.removeItem('user');
  
  // Hash password with MD5 (single hash - schema will apply transform:md5)
  const { MD5 } = await import('crypto-js');
  const hashedPassword = MD5(password).toString();
  
  // Query database in real-time for this specific user using Innque API
  const users = await apiClient.findObjects('users', { email: email });
  
  // Validate against real-time database result
  if (users && users.length > 0) {
    const user = users[0];
    
    // Check if user is active
    if (user.status !== 'active') {
      throw new Error('Account is inactive. Please contact support.');
    }
    
    // Validate password (compare single MD5 hash with stored single MD5 hash)
    if (user.password === hashedPassword) {
      // Get role information
      let role = null;
      if (user.roles && user.roles.length > 0) {
        const roleId = user.roles[0].id;
        const roles = await request(`/collections/roles?where={"id":"${roleId}"}`, {
          method: "GET",
          headers: {
            "X-Application-Id": APP_ID,
            "X-Master-Key": MASTER_KEY
          }
        });
        role = roles[0] || null;
      }
      
      // Store user data in localStorage (no JWT token needed with master key auth)
      localStorage.setItem('user', JSON.stringify({ ...user, role }));
      
      return { success: true, user };
    } else {
      throw new Error('Invalid email or password');
    }
  } else {
    throw new Error('User not found. Please check your email address and try again.');
  }
}

export async function signOut(options) {
  // Clear user data from localStorage
  localStorage.removeItem('user');
  // Clear any other session data
  localStorage.removeItem('candidates');
  localStorage.removeItem('votes');
}

export const getCurrentUser = (options) => request("/me", options);

// —————— Files API ——————
export async function uploadFile(file, filename = file.name, options) {
  // Convert file to blob if it's not already
  const blob = file instanceof Blob ? file : new Blob([file], { type: file.type });
  const headers = new Headers();
  headers.set("Content-Type", blob.type || "application/octet-stream");
  return request(`/files/${filename}`, {
    method: "POST",
    body: blob,
    headers,
    ...options,
  });
}

// —————— Schemas API ——————
export const createSchema = (schema, options) => request("/schemas", { method: "POST", body: schema, ...options });

export const getSchema = (collection, options) => request(`/schemas/${collection}`, options);

export const getSchemas = (where, options) => {
  const qp = where ? `?where=${encodeURIComponent(JSON.stringify(where))}` : "";
  return request(`/schemas${qp}`, options);
};

export const updateSchema = (schema, options) => request(`/schemas/${schema.collection}`, { method: "PUT", body: schema, ...options });

export const deleteSchema = (collection, options) => request(`/schemas/${collection}`, { method: "DELETE", ...options });
