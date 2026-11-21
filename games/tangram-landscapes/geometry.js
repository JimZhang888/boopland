/* Coordinates are in small-triangle leg lengths. Angles are 45-degree steps. */
const Tangram = (() => {
  'use strict';
  const eps = 1e-8;
  const basic = [
    [[0,0],[2,0],[0,2]], [[0,0],[2,0],[0,2]],
    [[0,0],[1,1],[-1,1]], [[0,0],[1,0],[1,1],[0,1]],
    [[0,0],[1,0],[2,1],[1,1]], [[0,0],[1,0],[0,1]], [[0,0],[1,0],[0,1]]
  ];
  function center(poly) {
    return poly.reduce(([x,y], p) => [x+p[0]/poly.length,y+p[1]/poly.length], [0,0]);
  }
  const blocks = basic.map(poly => {
    const [x,y] = center(poly);
    return poly.map(([a,b]) => [a-x,b-y]);
  });
  function polygon({id,x,y,turn,flip}) {
    const angle = turn*Math.PI/4, c=Math.cos(angle), s=Math.sin(angle);
    return blocks[id].map(([u,v]) => {
      const a = flip ? -u : u;
      return [x+a*c-v*s, y+a*s+v*c];
    });
  }
  function bounds(points) {
    const xs=points.map(p=>p[0]), ys=points.map(p=>p[1]);
    const l=Math.min(...xs), t=Math.min(...ys), r=Math.max(...xs), b=Math.max(...ys);
    return {l,t,r,b,w:r-l,h:b-t};
  }
  const edges = poly => poly.map((p,i) => [p,poly[(i+1)%poly.length]]);
  const cross = (ax,ay,bx,by) => ax*by-ay*bx;
  function intervals(polys,x) {
    const spans=[];
    for (const poly of polys) {
      const ys=[];
      for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
        const a=poly[i], b=poly[j];
        if ((a[0]>x)!==(b[0]>x)) ys.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));
      }
      if (ys.length) spans.push([Math.min(...ys),Math.max(...ys)]);
    }
    spans.sort((a,b)=>a[0]-b[0]);
    const merged=[];
    for (const range of spans) {
      const prev=merged[merged.length-1];
      if (prev && range[0]<=prev[1]+eps) prev[1]=Math.max(prev[1],range[1]);
      else merged.push(range);
    }
    return merged;
  }
  // Edge intersections partition the plane into strips with linear cross-sections.
  // A midpoint slice integrates each strip exactly, including triple overlaps.
  function measure(target, pieces) {
    const lines=target.concat(pieces).flatMap(edges);
    const xs=lines.map(([a])=>a[0]);
    for(let i=0;i<lines.length;i++) {
      const [a,b]=lines[i], dx=b[0]-a[0], dy=b[1]-a[1];
      for(let j=0;j<i;j++) {
        const [c,d]=lines[j], ex=d[0]-c[0], ey=d[1]-c[1];
        const det=cross(dx,dy,ex,ey);
        if(Math.abs(det)<eps) continue;
        const t=cross(c[0]-a[0],c[1]-a[1],ex,ey)/det;
        const u=cross(c[0]-a[0],c[1]-a[1],dx,dy)/det;
        if(t>0 && t<1 && u>0 && u<1) xs.push(a[0]+t*dx);
      }
    }
    xs.sort((a,b)=>a-b);
    let covered=0, union=0;
    for(let i=1;i<xs.length;i++) {
      const width=xs[i]-xs[i-1];
      if(width<eps) continue;
      const x=(xs[i]+xs[i-1])/2, goal=intervals(target,x), placed=intervals(pieces,x);
      for(const [top,bottom] of placed) {
        union+=(bottom-top)*width;
        for(const [a,b] of goal) covered+=Math.max(0, Math.min(b,bottom)-Math.max(a,top))*width;
      }
    }
    const coverage=Math.min(1,covered/8), overlap=Math.max(0,(8-union)/8);
    return {coverage,overlap,won:coverage>=0.986 && overlap<=0.008};
  }
  // Split the edges at T-junctions before cancelling shared segments. Only
  // the actual silhouette perimeter (including holes) is magnetic.
  function outline(polys) {
    const points=polys.flat(), segments=new Map();
    const key=p=>p.map(x=>Math.round(x*1e6)).join(',');
    for (const [a,b] of polys.flatMap(edges)) {
      const dx=b[0]-a[0], dy=b[1]-a[1], len=dx*dx+dy*dy;
      const ts=[0,1];
      for(const p of points){
        if(Math.abs(cross(dx,dy,p[0]-a[0],p[1]-a[1]))>eps) continue;
        const t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len;
        if(t>eps && t<1-eps) ts.push(t);
      }
      ts.sort((x,y)=>x-y);
      for(let i=1;i<ts.length;i++) {
        if(ts[i]-ts[i-1]<eps) continue;
        const seg=[ts[i-1],ts[i]].map(t=>[a[0]+dx*t,a[1]+dy*t]);
        const k=seg.map(key).sort().join('|');
        if(segments.has(k)) segments.delete(k); else segments.set(k,seg);
      }
    }
    return [...segments.values()];
  }
  function alignment(poly,segments,radius) {
    let vertex=null, edge=null;
    function keep(old,x,y) {
      const length=Math.hypot(x,y);
      return length<=radius && (!old || length<old.length) ? {x,y,length} : old;
    }
    for(const [a,b] of edges(poly)) for(const [c,d] of segments) {
      for(const p of [a,b]) for(const q of [c,d]) vertex=keep(vertex,q[0]-p[0],q[1]-p[1]);
      const dx=d[0]-c[0],dy=d[1]-c[1],len=Math.hypot(dx,dy);
      const ux=dx/len,uy=dy/len;
      if(Math.abs(cross(b[0]-a[0],b[1]-a[1],ux,uy))>0.0001) continue;
      const ta=(a[0]-c[0])*ux+(a[1]-c[1])*uy, tb=(b[0]-c[0])*ux+(b[1]-c[1])*uy;
      if(Math.min(len,Math.max(ta,tb))-Math.max(0,Math.min(ta,tb))<0.15) continue;
      const distance=cross(ux,uy,a[0]-c[0],a[1]-c[1]);
      edge=keep(edge,distance*uy,-distance*ux);
    }
    return vertex || edge || {x:0,y:0};
  }
  return {blocks, polygon, center, bounds, edges, outline, measure, alignment};
})();
if (typeof module !== 'undefined') module.exports=Tangram;
