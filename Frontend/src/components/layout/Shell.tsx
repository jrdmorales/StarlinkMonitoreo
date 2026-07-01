import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface Props {
  title:    string;
  onBack?:  () => void;
  children: React.ReactNode;
}

export default function Shell({ title, onBack, children }: Props) {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar title={title} onBack={onBack} />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
