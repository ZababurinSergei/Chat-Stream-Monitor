export function defaultTemplate({ state = {} }: { state: any; context: any }): string {
    return `
    <div class="test-component-a">
      <h2 class="title">${state.title || 'Test Component A'}</h2>
      <div class="counter">Counter: ${state.counter || 0}</div>
      <button class="btn-increment">Increment</button>
      <button class="btn-add">Add Item</button>
      <div class="items-list">
        ${state.items?.map((item: string, index: number) =>
        `<div class="item">${index + 1}. ${item}</div>`
    ).join('') || 'No items'}
      </div>
    </div>
  `;
}

export function renderList({ state = {} }: { state: any; context: any }): string {
    const items = state.items || [];
    if (!items.length) return '<p>No items</p>';
    return items.map((item: string, index: number) => `<div class="item">${index + 1}. ${item}</div>`).join('');
}