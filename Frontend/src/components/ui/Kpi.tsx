interface Props {
  label:  string;
  value:  string | number;
  sub?:   string;
  accent?: string;
  icon?:  React.FC<{ size?: number }>;
}

export default function Kpi({ label, value, sub, accent, icon: I }: Props) {
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {I && <span className="kpi-ic" style={{ color: accent }}><I size={18} /></span>}
      </div>
      <div className="kpi-value" style={accent ? { color: accent } : undefined}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
