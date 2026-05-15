"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { cn } from "@/lib/cn";
import type { Procedure } from "@/lib/api";

interface ProcedureGraphProps {
  procedures: Procedure[];
  onSelect: (id: string) => void;
  selectedProcedure: string | null;
}

type ProcStatus = "pending" | "in_progress" | "done" | "blocked" | "escalated";

const STATUS_COLOR: Record<ProcStatus, string> = {
  done: "#22C55E",
  in_progress: "#E8751A",
  pending: "#94A3B8",
  blocked: "#EF4444",
  escalated: "#F59E0B",
};

const STATUS_RING: Record<ProcStatus, string> = {
  done: "#16A34A",
  in_progress: "#C05A10",
  pending: "#64748B",
  blocked: "#B91C1C",
  escalated: "#D97706",
};

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  status: ProcStatus;
  days: number;
  order: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: SimNode | string;
  target: SimNode | string;
}

function formatName(id: string) {
  return id.replace(/^tn_/, "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * D3 force-directed procedure dependency graph.
 * Nodes = procedures, sized by estimated duration.
 * Edges = dependency arrows (directed).
 * Hover: highlights upstream (saffron) + downstream (faded).
 * Click: fires onSelect to open ProcedureDetail.
 */
export function ProcedureGraph({ procedures, onSelect, selectedProcedure }: ProcedureGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; proc: Procedure } | null>(null);
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);

  const runSim = useCallback(() => {
    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    if (!svg || !container || procedures.length === 0) return;

    // Read theme-aware text color from CSS custom properties
    const labelColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-text-primary").trim() || "#1B2A4A";

    const W = container.clientWidth || 600;
    const H = Math.max(420, container.clientHeight || 420);

    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("width", W).attr("height", H);
    svg.selectAll("*").remove();

    // Defs: arrowhead marker
    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -4 8 8")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L8,0L0,4")
      .attr("fill", "#CBD5E1");

    defs.append("marker")
      .attr("id", "arrow-saffron")
      .attr("viewBox", "0 -4 8 8")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L8,0L0,4")
      .attr("fill", "#E8751A");

    // Build nodes and links
    const nodes: SimNode[] = procedures.map((p, i) => ({
      id: p.procedure_id,
      name: formatName(p.procedure_id),
      status: (p.status as ProcStatus) || "pending",
      days: p.estimated_start_after_days || i * 5,
      order: p.order || i + 1,
    }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = [];

    procedures.forEach((p) => {
      p.depends_on_procedure_ids.forEach((dep) => {
        const src = nodeMap.get(dep);
        const tgt = nodeMap.get(p.procedure_id);
        if (src && tgt) links.push({ source: src, target: tgt });
      });
    });

    // Radius by estimated days
    const rScale = d3.scaleSqrt().domain([0, 60]).range([16, 28]).clamp(true);

    // SVG groups
    const linkGroup = svg.append("g").attr("class", "links");
    const nodeGroup = svg.append("g").attr("class", "nodes");

    // Draw links
    const linkEls = linkGroup
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#CBD5E1")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Draw nodes
    const nodeEls = nodeGroup
      .selectAll<SVGGElement, SimNode>("g.node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer");

    // Outer ring
    nodeEls.append("circle")
      .attr("r", (d) => rScale(d.days) + 3)
      .attr("fill", "none")
      .attr("stroke", (d) => STATUS_RING[d.status])
      .attr("stroke-width", 2)
      .attr("opacity", 0.4);

    // Fill circle
    nodeEls.append("circle")
      .attr("r", (d) => rScale(d.days))
      .attr("fill", (d) => STATUS_COLOR[d.status])
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    // Order number
    nodeEls.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "white")
      .attr("font-size", "11")
      .attr("font-weight", "bold")
      .text((d) => d.order);

    // Label below
    nodeEls.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => rScale(d.days) + 14)
      .attr("fill", labelColor)
      .attr("font-size", "9")
      .attr("font-weight", "500")
      .text((d) => d.name.length > 16 ? d.name.slice(0, 14) + "…" : d.name);

    // Highlight selected node
    if (selectedProcedure) {
      nodeEls.selectAll<SVGCircleElement, SimNode>("circle:first-child")
        .attr("stroke-width", (d) => d.id === selectedProcedure ? 3 : 2)
        .attr("opacity", (d) => d.id === selectedProcedure ? 1 : 0.4);
    }

    // Hover interactions
    nodeEls
      .on("mouseenter", function(event, d) {
        const rect = containerRef.current?.getBoundingClientRect();
        const proc = procedures.find((p) => p.procedure_id === d.id);
        if (proc && rect) {
          setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, proc });
        }

        // Highlight upstream (saffron) and downstream (faded)
        const upstream = new Set<string>();
        const downstream = new Set<string>();
        procedures.find((p) => p.procedure_id === d.id)?.depends_on_procedure_ids.forEach((dep) => upstream.add(dep));
        procedures.forEach((p) => {
          if (p.depends_on_procedure_ids.includes(d.id)) downstream.add(p.procedure_id);
        });

        linkEls
          .attr("stroke", (l: SimLink) => {
            const src = (l.source as SimNode).id;
            const tgt = (l.target as SimNode).id;
            if (src === d.id || upstream.has(src)) return "#E8751A";
            return "#CBD5E1";
          })
          .attr("stroke-width", (l: SimLink) => {
            const src = (l.source as SimNode).id;
            if (src === d.id || upstream.has(src)) return 2.5;
            return 1.5;
          })
          .attr("marker-end", (l: SimLink) => {
            const src = (l.source as SimNode).id;
            if (src === d.id || upstream.has(src)) return "url(#arrow-saffron)";
            return "url(#arrow)";
          });

        nodeEls.selectAll<SVGCircleElement, SimNode>("circle:nth-child(2)")
          .attr("opacity", (n) =>
            n.id === d.id || upstream.has(n.id) || downstream.has(n.id) ? 1 : 0.3
          );
      })
      .on("mousemove", function(event) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && tooltip) {
          setTooltip((prev) => prev ? { ...prev, x: event.clientX - rect.left, y: event.clientY - rect.top } : null);
        }
      })
      .on("mouseleave", function() {
        setTooltip(null);
        linkEls.attr("stroke", "#CBD5E1").attr("stroke-width", 1.5).attr("marker-end", "url(#arrow)");
        nodeEls.selectAll("circle:nth-child(2)").attr("opacity", 1);
      })
      .on("click", (_, d) => onSelect(d.id));

    // Drag behaviour
    const drag = d3.drag<SVGGElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeEls.call(drag);

    // Simulation
    const sim = d3.forceSimulation<SimNode, SimLink>(nodes)
      .force("charge", d3.forceManyBody<SimNode>().strength(-280))
      .force("link", d3.forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(130))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide<SimNode>().radius(50))
      .on("tick", () => {
        linkEls
          .attr("x1", (d) => (d.source as SimNode).x ?? 0)
          .attr("y1", (d) => (d.source as SimNode).y ?? 0)
          .attr("x2", (d) => (d.target as SimNode).x ?? 0)
          .attr("y2", (d) => (d.target as SimNode).y ?? 0);

        nodeEls.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    simRef.current = sim;
    return () => { sim.stop(); };
  }, [procedures, selectedProcedure, onSelect]);

  useEffect(() => {
    const cleanup = runSim();
    return () => { cleanup?.(); };
  }, [runSim]);

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <svg ref={svgRef} className="w-full" />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 min-w-[180px] rounded-[var(--radius-md)] border border-paper-dark bg-surface px-3 py-2 shadow-card text-xs"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 40,
            transform: tooltip.x > 400 ? "translateX(-100%)" : "none",
          }}
        >
          <p className="font-semibold text-navy">{formatName(tooltip.proc.procedure_id)}</p>
          <p className="text-text-muted mt-0.5 capitalize">{tooltip.proc.status.replace("_", " ")}</p>
          {tooltip.proc.why_this_is_needed && (
            <p className="text-text-secondary mt-1 line-clamp-2">{tooltip.proc.why_this_is_needed}</p>
          )}
          <p className="mt-1 text-saffron font-medium">Click to view details →</p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex flex-col gap-1 rounded-[var(--radius-sm)] border border-paper-dark bg-surface/90 px-2 py-1.5 text-[9px] text-text-muted">
        {(Object.entries(STATUS_COLOR) as [ProcStatus, string][]).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{status.replace("_", " ")}</span>
          </div>
        ))}
        <div className="mt-1 border-t border-paper-dark pt-1">Drag nodes · Click for detail</div>
      </div>
    </div>
  );
}
