import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const NODE_COLORS = {
  disease: '#ef4444',
  target: '#8b5cf6',
  pathway: '#06b6d4',
  drug: '#10b981',
};

const NODE_RADIUS = {
  disease: 28,
  target: 20,
  pathway: 18,
  drug: 22,
};

export default function EvidenceGraph({ visible, nodes: propNodes, links: propLinks }) {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);

  useEffect(() => {
    if (!visible || !svgRef.current) return;

    const container = svgRef.current.parentElement;
    const W = container.clientWidth || 800;
    const H = container.clientHeight || 420;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', W).attr('height', H);

    // Gradient defs
    const defs = svg.append('defs');

    Object.entries(NODE_COLORS).forEach(([type, color]) => {
      const grad = defs
        .append('radialGradient')
        .attr('id', `grad-${type}`)
        .attr('cx', '35%')
        .attr('cy', '35%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', 0.3);
      grad.append('stop').attr('offset', '100%').attr('stop-color', color);
    });

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow').attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    const merge = filter.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const nodes = (propNodes || []).map((d) => ({ ...d, x: (d.x / 800) * W, y: (d.y / 500) * H }));
    const links = (propLinks || []).map((l) => ({ ...l }));

    // Nothing to render if backend hasn't returned graph data yet — show placeholder
    if (nodes.length === 0) {
      svg.append('text')
        .attr('x', W / 2).attr('y', H / 2 - 16)
        .attr('text-anchor', 'middle')
        .attr('font-size', '15px')
        .attr('fill', 'rgba(255,255,255,0.35)')
        .text('Awaiting backend graph data…');
      svg.append('text')
        .attr('x', W / 2).attr('y', H / 2 + 12)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', 'rgba(255,255,255,0.2)')
        .text('The evidence graph will populate once the pipeline completes.');
      return;
    }

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => 100 + (1 - d.strength) * 60)
          .strength(0.4)
      )
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide().radius((d) => NODE_RADIUS[d.type] + 14));

    simulationRef.current = simulation;

    const g = svg.append('g');

    // Zoom
    svg.call(
      d3.zoom()
        .scaleExtent([0.5, 2.5])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

    // Links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d) => {
        const source = nodes.find((n) => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
        return source ? NODE_COLORS[source.type] : '#555';
      })
      .attr('stroke-opacity', (d) => 0.3 + d.strength * 0.4)
      .attr('stroke-width', (d) => 1 + d.strength * 3);

    // Link strength labels
    const linkLabel = g
      .append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('font-size', '9px')
      .attr('fill', 'rgba(255,255,255,0.4)')
      .attr('text-anchor', 'middle')
      .text((d) => (d.strength * 100).toFixed(0) + '%');

    // Node groups
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Outer glow ring
    node
      .append('circle')
      .attr('r', (d) => NODE_RADIUS[d.type] + 8)
      .attr('fill', 'none')
      .attr('stroke', (d) => NODE_COLORS[d.type])
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 2);

    // Main node circle
    node
      .append('circle')
      .attr('r', (d) => NODE_RADIUS[d.type])
      .attr('fill', (d) => `url(#grad-${d.type})`)
      .attr('stroke', (d) => NODE_COLORS[d.type])
      .attr('stroke-width', 2)
      .attr('filter', (d) => (d.type === 'disease' ? 'url(#glow)' : 'none'))
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', NODE_RADIUS[d.type] + 5)
          .attr('stroke-width', 3);
      })
      .on('mouseout', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', NODE_RADIUS[d.type])
          .attr('stroke-width', 2);
      });

    // Label
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.type === 'disease' ? 5 : 4))
      .attr('font-size', (d) => (d.type === 'disease' ? '11px' : '10px'))
      .attr('font-weight', (d) => (d.type === 'disease' ? '700' : '500'))
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text((d) => d.label);

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      linkLabel
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Animate nodes in
    node.attr('opacity', 0).transition().duration(600).delay((d, i) => i * 80).attr('opacity', 1);

    return () => {
      simulation.stop();
    };
  }, [visible, propNodes, propLinks]);

  return (
    <div className="graph-container">
      <div className="graph-legend">
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <div key={type} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />
            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </div>
        ))}
      </div>
      <svg ref={svgRef} className="evidence-svg" />
      <div className="graph-hint">Drag nodes • Scroll to zoom</div>
    </div>
  );
}
