interface IconProps {
  size?:   number;
  stroke?: string;
  fill?:   string;
  sw?:     number;
}

function Icon({ d, size = 20, fill = 'none', stroke = 'currentColor', sw = 1.8, children, vb = 24 }: IconProps & { d?: string; children?: React.ReactNode; vb?: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill} stroke={stroke}
         strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {d ? <path d={d} /> : children}
    </svg>
  );
}

export const Icons = {
  grid:    (p: IconProps) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></Icon>,
  chart:   (p: IconProps) => <Icon {...p}><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16l3-4 3 2 4-6"/></Icon>,
  alert:   (p: IconProps) => <Icon {...p}><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></Icon>,
  sat:     (p: IconProps) => <Icon {...p}><path d="M5 13a7 7 0 0 1 6 6"/><path d="M5 18a2 2 0 0 1 1 1"/><path d="m13.4 10.6 3-3"/><path d="M19 4a2.8 2.8 0 0 0-4 0l-3 3 4 4 3-3a2.8 2.8 0 0 0 0-4Z"/><path d="m9.5 14.5-5 5"/></Icon>,
  search:  (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></Icon>,
  back:    (p: IconProps) => <Icon {...p}><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></Icon>,
  sort:    (p: IconProps) => <Icon {...p}><path d="m8 9 4-4 4 4"/><path d="m16 15-4 4-4-4"/></Icon>,
  clock:   (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  download:(p: IconProps) => <Icon {...p}><path d="M12 3v12"/><path d="m7 11 5 4 5-4"/><path d="M5 21h14"/></Icon>,
  logout:  (p: IconProps) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></Icon>,
  spark:   (p: IconProps) => <Icon {...p}><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><circle cx="12" cy="12" r="3.5"/></Icon>,
  shield:  (p: IconProps) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Icon>,
  edit:    (p: IconProps) => <Icon {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>,
  trash:   (p: IconProps) => <Icon {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></Icon>,
  refresh: (p: IconProps) => <Icon {...p}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Icon>,
  book:    (p: IconProps) => <Icon {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Icon>,
  chevron: (p: IconProps) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
};
