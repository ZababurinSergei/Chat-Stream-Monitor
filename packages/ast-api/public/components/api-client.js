// components/api-client.js

export class APIClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Status
  getStatus() {
    return this.request('/status');
  }

  // Functions
  getFunctions() {
    return this.request('/functions');
  }

  getFunction(id) {
    return this.request(`/functions/${id}`);
  }

  searchFunctions(q) {
    return this.request(`/search/functions?q=${encodeURIComponent(q)}`);
  }

  // Paths
  getPaths(from, to, maxDepth = 20) {
    return this.request(`/paths?from=${from}&to=${to}&maxDepth=${maxDepth}`);
  }

  getReachable(from, to, maxDepth = 20) {
    return this.request(`/reachable?from=${from}&to=${to}&maxDepth=${maxDepth}`);
  }

  getDependencies(id, depth = 3) {
    return this.request(`/dependencies/${id}?depth=${depth}`);
  }

  // Stats
  getStats() {
    return this.request('/stats');
  }

  getModules() {
    return this.request('/modules');
  }

  getFiles() {
    return this.request('/files');
  }

  getConstants() {
    return this.request('/constants');
  }

  getLibraries() {
    return this.request('/libraries');
  }

  // Package Management
  getPackage() {
    return this.request('/package');
  }

  updateScripts(scripts) {
    return this.request('/package/scripts', {
      method: 'POST',
      body: JSON.stringify(scripts),
    });
  }

  updateDependencies(deps) {
    return this.request('/package/dependencies', {
      method: 'POST',
      body: JSON.stringify(deps),
    });
  }

  installPackages(packages, dev = false) {
    return this.request('/package/install', {
      method: 'POST',
      body: JSON.stringify({ packages, dev }),
    });
  }

  uninstallPackages(packages) {
    return this.request('/package/uninstall', {
      method: 'POST',
      body: JSON.stringify({ packages }),
    });
  }

  runScript(script) {
    return this.request('/package/run', {
      method: 'POST',
      body: JSON.stringify({ script }),
    });
  }

  // Load/Reset
  loadData(data) {
    return this.request('/load', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  reset() {
    return this.request('/reset', { method: 'POST' });
  }

  exportAll() {
    return this.request('/export/all');
  }
}
