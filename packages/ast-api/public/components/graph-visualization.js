// components/graph-visualization.js - ключевые методы с логами

export class GraphVisualization extends HTMLElement {
  // ... остальной код ...

  setSelectedNode(id) {
    console.log('[Graph] 🎯 Установка выбранной ноды:', id);
    this.selectedNodeId = id;
    this.highlightNode(id);
  }

  // ...

  highlightNode(id) {
    console.log('[Graph] 🎯 Подсветка ноды:', id);
    this.selectedNodeId = id;

    this.g.selectAll('.node-group').each(function (d) {
      const circle = d3.select(this).select('circle');
      const text = d3.select(this).select('text');

      if (d.id === id) {
        console.log('[Graph] ⭐ Активная нода:', d.name);
        circle
          .transition()
          .duration(300)
          .attr('fill', '#fbbf24')
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 4)
          .attr('r', d.isExported ? 16 : 12);

        text
          .transition()
          .duration(300)
          .attr('fill', '#fbbf24')
          .attr('font-size', 11)
          .text('▶ ' + (d.name.length > 14 ? d.name.slice(0, 12) + '…' : d.name));
      } else {
        // ... остальной код ...
      }
    });

    this.linkElements
      .transition()
      .duration(300)
      .attr('stroke-opacity', d => {
        if (!id) {return 0.4;}
        if (d.source.id === id || d.target.id === id) {
          console.log('[Graph] 🔗 Связанное ребро:', d.source.id, '->', d.target.id);
          return 0.9;
        }
        return 0.1;
      })
      .attr('stroke-width', d => {
        if (!id) {return 1.5;}
        if (d.source.id === id || d.target.id === id) {return 3;}
        return 1;
      });
  }

  // ...
}
