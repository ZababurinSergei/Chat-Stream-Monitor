// components/app-state.js
import { APIClient } from './api-client.js';

export class AppState extends EventTarget {
  constructor() {
    super();
    this.api = new APIClient();
    this.data = null;
    this.functions = [];
    this.stats = null;
    this.selectedFunctionId = null;
    this.quests = [];
    this.currentQuest = null;
    this.isLoading = false;
    this.error = null;
    this.uploadedFileName = null;
  }

  async initialize() {
    this.isLoading = true;
    this.dispatchEvent(new Event('loading'));

    try {
      const [status, functions, stats] = await Promise.all([
        this.api.getStatus(),
        this.api.getFunctions(),
        this.api.getStats(),
      ]);

      this.data = status;
      this.functions = functions.functions || [];
      this.stats = stats;

      this.isLoading = false;
      this.dispatchEvent(new Event('loaded'));
    } catch (error) {
      this.error = error.message;
      this.isLoading = false;
      this.dispatchEvent(new Event('error'));
    }
  }

  async uploadJSON(file) {
    this.isLoading = true;
    this.dispatchEvent(new Event('loading'));
    this.uploadedFileName = file.name;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      await this.api.loadData(data);

      const [status, functions, stats] = await Promise.all([
        this.api.getStatus(),
        this.api.getFunctions(),
        this.api.getStats(),
      ]);

      this.data = status;
      this.functions = functions.functions || [];
      this.stats = stats;

      this.isLoading = false;
      this.dispatchEvent(new Event('loaded'));
      this.dispatchEvent(new CustomEvent('upload-success', { detail: { fileName: file.name } }));

      return { success: true };
    } catch (error) {
      this.error = error.message;
      this.isLoading = false;
      this.dispatchEvent(new Event('error'));
      this.dispatchEvent(new CustomEvent('upload-error', { detail: { error: error.message } }));
      return { success: false, error: error.message };
    }
  }

  async executeQuest(quest) {
    this.isLoading = true;
    this.dispatchEvent(new Event('quest-start'));

    try {
      const result = await quest.action(this.api);
      quest.status = 'completed';
      this.currentQuest = quest;
      this.isLoading = false;
      this.dispatchEvent(new Event('quest-complete'));
      return result;
    } catch (error) {
      this.error = error.message;
      this.isLoading = false;
      this.dispatchEvent(new Event('quest-error'));
      throw error;
    }
  }

  async executeQuestById(questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (!quest) {
      throw new Error(`Quest ${questId} not found`);
    }
    return this.executeQuest(quest);
  }

  selectFunction(id) {
    this.selectedFunctionId = id;
    this.dispatchEvent(new CustomEvent('function-selected', { detail: { id } }));
  }
}
